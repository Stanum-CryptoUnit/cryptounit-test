#include <eosiolib/multi_index.hpp>
#include <eosiolib/contract.hpp>
#include <eosiolib/eosio.hpp>
#include <eosiolib/asset.hpp>
#include <eosiolib/time.hpp>
#include <eosiolib/print.hpp>
#include <eosiolib/system.hpp>

// #define IS_DEBUG //commit for production
//#define PERCENT_PRECISION 10000
class [[eosio::contract]] tokenlock : public eosio::contract {

public:
    tokenlock( eosio::name receiver, eosio::name code, eosio::datastream<const char*> ds ): eosio::contract(receiver, code, ds)
    {}
    [[eosio::action]] void add(eosio::name username, uint64_t id, uint64_t parent_id, eosio::time_point_sec datetime, uint64_t algorithm, int64_t amount);
    [[eosio::action]] void migrate(eosio::name username, eosio::public_key public_key);
    [[eosio::action]] void refresh(eosio::name username, uint64_t id);
    [[eosio::action]] void withdraw(eosio::name username, uint64_t id);


    void apply(uint64_t receiver, uint64_t code, uint64_t action);
    eosio::asset get_debt(eosio::name username);
    void modify_debt(eosio::name username, eosio::asset amount_to_add);

    #ifdef IS_DEBUG
        static constexpr bool _is_debug = true;
        static constexpr eosio::name _self = "tokenlock"_n;
        static constexpr eosio::name _reserve = "reserve"_n;
        static constexpr eosio::name _token_contract = "eosio.token"_n;
        static constexpr eosio::symbol _op_symbol     = eosio::symbol(eosio::symbol_code("CRU"), 0);
        static constexpr uint64_t _alg1_freeze_seconds = 10;
        static constexpr uint64_t _alg2_freeze_seconds = 15;
        static constexpr uint64_t _cycle_length = 5;

    #else
        static constexpr bool _is_debug = false;
        static constexpr eosio::name _self = "tokenlock"_n;
        static constexpr eosio::name _reserve = "reserve"_n;
        static constexpr eosio::name _token_contract = "eosio.token"_n;
        static constexpr eosio::symbol _op_symbol     = eosio::symbol(eosio::symbol_code("CRU"), 0);
        static constexpr uint64_t _alg1_freeze_seconds = 25920000;
        static constexpr uint64_t _alg2_freeze_seconds = 47088000;
        static constexpr uint64_t _cycle_length = 2592000;

    #endif

    struct [[eosio::table]] users {
        eosio::name username;
        eosio::time_point_sec migrated_at;

        uint64_t primary_key() const {return username.value;}

        EOSLIB_SERIALIZE(users, (username)(migrated_at))
    };

    typedef eosio::multi_index<"users"_n, users> users_index;


    struct [[eosio::table]] locks {
        uint64_t id;
        eosio::time_point_sec created;
        eosio::time_point_sec last_distribution_at;

        uint64_t algorithm;
        eosio::asset amount;
        eosio::asset available;
        eosio::asset withdrawed;
        uint64_t primary_key() const {return id;}

        EOSLIB_SERIALIZE(locks, (id)(created)(last_distribution_at)(algorithm)(amount)(available)(withdrawed))
    };

    typedef eosio::multi_index<"locks"_n, locks> locks_index;


    struct [[eosio::table]] debts {
        eosio::name username;
        eosio::asset amount;

        uint64_t primary_key() const {return username.value;}

        EOSLIB_SERIALIZE(debts, (username)(amount))
    };

    typedef eosio::multi_index<"debts"_n, debts> debts_index;


    struct [[eosio::table]] history {
        uint64_t id;
        uint64_t lock_id;
        uint64_t lock_parent_id;
        eosio::name username;

        eosio::time_point_sec created;
        uint64_t algorithm;
        eosio::asset amount;

        uint64_t primary_key() const {return id;}

        uint64_t byusername() const {return username.value;}
        uint64_t byid() const {return lock_id;}
        uint64_t byparentid() const {return lock_parent_id;}
        uint64_t byalgo() const {return algorithm;}

        EOSLIB_SERIALIZE(history, (id)(lock_id)(lock_parent_id)(username)(created)(algorithm)(amount))
    };

    typedef eosio::multi_index<"history"_n, history,
        eosio::indexed_by<"byusername"_n, eosio::const_mem_fun<history, uint64_t, &history::byusername>>,
        eosio::indexed_by<"byid"_n, eosio::const_mem_fun<history, uint64_t, &history::byid>>,
        eosio::indexed_by<"byparentid"_n, eosio::const_mem_fun<history, uint64_t, &history::byparentid>>,
        eosio::indexed_by<"byalgo"_n, eosio::const_mem_fun<history, uint64_t, &history::byalgo>>
    > history_index;







   struct permission_level_weight {
      eosio::permission_level  permission;
      uint16_t          weight;

      // explicit serialization macro is not necessary, used here only to improve compilation time
      EOSLIB_SERIALIZE( permission_level_weight, (permission)(weight) )
   };

   struct key_weight {
      eosio::public_key  key;
      uint16_t           weight;

      // explicit serialization macro is not necessary, used here only to improve compilation time
      EOSLIB_SERIALIZE( key_weight, (key)(weight) )
   };

   struct wait_weight {
      uint32_t           wait_sec;
      uint16_t           weight;

      // explicit serialization macro is not necessary, used here only to improve compilation time
      EOSLIB_SERIALIZE( wait_weight, (wait_sec)(weight) )
   };

   struct authority {
      uint32_t                              threshold = 0;
      std::vector<key_weight>               keys;
      std::vector<permission_level_weight>  accounts;
      std::vector<wait_weight>              waits;

      // explicit serialization macro is not necessary, used here only to improve compilation time
      EOSLIB_SERIALIZE( authority, (threshold)(keys)(accounts)(waits) )
   };


};
