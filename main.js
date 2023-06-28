var roleHarvester = require('./roles/role.harvester');
var roleHauler = require('./roles/role.hauler');

module.exports.loop = function () {
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        roleHarvester.run(creep);
        print("Spawned");
    }
}