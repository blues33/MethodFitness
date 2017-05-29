module.exports = function(pg, config, promiseretry) {
  const ping = () => {
    const configs = config.configs.children.postgres.config;
    let dbExists;
    const client = new pg.Client(configs);
    return new Promise((res, rej) => {
      // connect to our database
      return client.connect(connError => {
        if (connError) {
          console.log('==========connError=========');
          console.log(connError);
          console.log('==========END connError=========');
          return rej(connError);
        }
        // execute a query on our database
        client.query(`select relname as table from pg_stat_user_tables where schemaname = 'public'`,
          (queryErr, result) => {
            if (queryErr) {
              console.log('==========queryErr=========');
              console.log(queryErr);
              console.log('==========END queryErr=========');
              return rej(queryErr);
            }
            dbExists = !!result.rows[0];

            if (!dbExists) {return rej('No Tables in the DB yet');}
            console.log('==========dbExists=========');
            console.log(dbExists);
            console.log('==========END dbExists=========');

            // disconnect the client
            client.end(endErr => {
              if (endErr) {
                console.log('==========endErr=========');
                console.log(endErr);
                console.log('==========END endErr=========');

                return rej(endErr);
              }
            });
            return res(dbExists);
          });
      });
    });
  };
  return () => {
    return promiseretry((retry, number) => {
      console.log('attempt number', number);
      return ping().catch(retry);
    });
  };
};
