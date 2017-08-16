const express = require('express'),
      fs = require('fs'),
      request = require('request'),
      cheerio = require('cheerio'),
      app = express(),
      cfg = require('./config/config'),
	    secrets = require('./config/config-secrets');

const config = Object.assign({}, cfg, secrets)

request(config.url, function(error, response, html){
    if (!error) {
      console.log('Retrieving data from ' + config.url + "...");
      let players = []
      let projections = [];
      let $ = cheerio.load(html);

      const tables = $(config.classname)
      const names = tables.eq(0);
      const stats = tables.eq(1);

      names.children().each((ridx, row) => {
        $(row).children().each((cidx, cell) => {
          const name = $(cell).children().first().children().first().text();
          const posAndTeam = $(cell).text()
          const index = posAndTeam.indexOf(',');
          const pos = posAndTeam.substring(index-2, index);
          players.push(name + config.delimiter + pos);
        });
      });

      stats.children().each((ridx, row) => {
        const cells = $(row).children();

        const compAndAttempts = cells.eq(4).text().trim().split('/');
        const comp = compAndAttempts[0];
        const attempts = compAndAttempts[1];
        const passYds = cells.eq(5).text().trim();
        const passTds = cells.eq(6).text().trim();
        const ints = cells.eq(7).text().trim();
        const rushYds = cells.eq(9).text().trim();
        const rushTds = cells.eq(10).text().trim();
        const rec = cells.eq(11).text().trim();
        const recYds = cells.eq(12).text().trim();
        const recTds = cells.eq(13).text().trim();
        projections.push([comp, attempts, passYds, passTds, ints, rushYds, rushTds, rec, recYds, recTds].join(config.delimiter));
      });

      const combined = projections.map((p, idx) => {
        return players[idx] + config.delimiter + p;
      });
      if (config.headers && config.headers.length > 0) {
        combined.unshift(config.headers.join(config.delimiter))
      }

      const dt = new Date()
      const month = dt.getMonth() + 1;
      const dateStamp = [dt.getFullYear(), (month < 10 ? '0' : '') + month, dt.getDate()].join('');
      const outputFile = config.outputDir + '/' + config.outputFilePrefix + dateStamp + config.outputFileExt;

      fs.writeFile(outputFile, combined.join('\r\n'), function(err) {
          if(err) {
              return console.log(err);
          }

          console.log('Output file ' + outputFile + ' saved successfully!');
      });
   }
})
