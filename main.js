var mysql = require('mysql');
require('array.prototype.find');

var config = require('./config.json');

var leagueConnection = mysql.createConnection(config.mysql.league);
leagueConnection.connect();
var forumConnection = mysql.createConnection(config.mysql.forum);
forumConnection.connect();

// Get the top playes from all leagues.
leagueConnection.query(
  'SELECT sc.league_id, sc.rank, sc.user_is_deleted, u.name \
   FROM lg_scores AS sc \
   JOIN lg_users AS u ON u.id = sc.user_id \
   WHERE rank = 1 AND sc.user_is_deleted = 0',
function(err, rows, fields) {
  if (err) throw err;
  rows.forEach(function(row) {
	var badgeCfg = config.leagues.find(function(l) { return l.id === row.league_id });
	if (!badgeCfg) return;

	// This is the badge identifier as in the `badges` forum option.
	var badge = badgeCfg.badge;

	// Remove all existing badges of this type.
	forumConnection.query('DELETE FROM userBadges WHERE badge = ?', [badge], function(err) {
	  if (err) throw err;
	});

	// Add the new badge for our winner.
	forumConnection.query(
	  'INSERT INTO userBadges (userId, badge) \
	   SELECT id, ? \
	   FROM users \
	   WHERE userName = ?',
	  [badge, row.name],
	  function(err) {
		if (err) throw err;
		console.log(['Awarded', badge, 'badge to', row.name].join(' '));
	  }
	);
  });
  forumConnection.end();
});

leagueConnection.end();
