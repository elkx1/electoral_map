class ElectionResults {
    constructor(date, results) {
      this.date = date;
      this.results = results;
  
      this._partyNames = results.length == 0 ? [] : Object.keys(results[0]).filter(
        col => col !== 'Name' && col !== 'MP' && col !== 'Area' && col !== 'County' && col !== 'Electorate'
      );
  
      this._regionNames = results.map(item => item.Name);
  
      this._winningParties = {};
      this._votes = {};
      this._votesPercent = {};
  
      results.forEach(result => {
        const regionName = result.Name;
        const partyScores = this._partyNames.map(party => ({ party, score: parseInt(result[party]) }));
  
        const winningParty = partyScores.reduce((prev, current) => (prev.score > current.score ? prev : current)).party;
        this._winningParties[regionName] = winningParty;
  
        this._votes[regionName] = partyScores;
  
        const votesTotal = partyScores.reduce((a, b) => a + b.score, 0);
  
        const votesPercent = partyScores.map(function (v) {
          return { "party": v.party, "score": v.score / votesTotal * 100 };
        });
        this._votesPercent[regionName] = votesPercent;
  
        // console.log("Winnning party for " + regionName + ": " + winningParty)
      });
    }
  
    getPartyNames() {
      return this._partyNames;
    }
  
    getRegionNames() {
      return this._regionNames;
    }
  
    getWinningParty(regionName) {
      return this._winningParties[regionName];
    }
  
    getVotePercentages(regionName) {
      return this._votesPercent[regionName];
    }
  
    getVotes(regionName) {
      return this._votes[regionName];
    }
  
    static parse(date, resultsStr) {
      const lines = resultsStr.split(new RegExp("\r\n|\n"));
      if (lines.length == 0) {
        return [];
      }
  
      function splitLine(line) {
        // Don't care about escaping right now
        return line.split(";");
      }
  
      const columns = splitLine(lines[0]);
      const objects = lines.slice(1).map(splitLine).map(parts => {
        var item = {};
        for (var i = 0; i < parts.length; ++i) {
          if (i >= columns.length) {
            throw new Error("More elements found than columns in row");
          }
          item[columns[i]] = parts[i];
        }
        return item;
      })
  
      return new ElectionResults(date, objects);
    }
}

export { ElectionResults }