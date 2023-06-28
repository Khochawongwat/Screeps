var roleHarvester = require('./role.harvester');
var roleHauler = require('./role.hauler');
var roleBuilder = require('./role.builder')

function areAllDestinationsFull() {
  const destinations = _.map(Game.spawns['Spawn1'].room.find(FIND_SOURCES), function (src) {
    let nearbyHarvesters = src.pos.findInRange(FIND_MY_CREEPS, 1, {
      filter: (creep) => creep.memory.role === 'harvester' && creep.memory.action === 'harvesting',
    });
    let nearbyDangers = src.pos.findInRange(FIND_HOSTILE_CREEPS, 2);

    let freeSpaces = getAdjacentPositions(src.pos).filter((pos) => pos.lookFor(LOOK_TERRAIN)[0] !== 'wall');

    if (nearbyHarvesters.length < freeSpaces.length && nearbyDangers.length === 0) {
      return { pos: src.pos, range: 1, freeSpaces: freeSpaces };
    }
  }).filter(Boolean);

  for (const destination of destinations) {
    const { pos, freeSpaces } = destination;
    const creepsAtDestination = pos.lookFor(LOOK_CREEPS);
    if (creepsAtDestination.length < freeSpaces.length) {
      return false;
    }
  }
  return true;
}

function getAdjacentPositions(pos) {
  const offsets = [
    { dx: -1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 },
  ];

  const adjacentPositions = [];
  const roomName = pos.roomName;

  for (const offset of offsets) {
    const x = pos.x + offset.dx;
    const y = pos.y + offset.dy;

    if (x >= 0 && x <= 49 && y >= 0 && y <= 49) {
      adjacentPositions.push(new RoomPosition(x, y, roomName));
    }
  }
  return adjacentPositions;
}

module.exports.loop = function () {
  var spawn = Game.spawns['Spawn1'];
  var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester');
  var haulers = _.filter(Game.creeps, (creep) => creep.memory.role === 'hauler');

  if (spawn.room.energyAvailable) {
    let result;
    if (haulers.length < harvesters.length) {
      let creepName = "Hauler" + Game.time;
      let assignedHarvester = _.min(harvesters, (harvester) => harvester.memory.assignedHaulers ? harvester.memory.assignedHaulers.length : 0);
      result = spawn.spawnCreep(roleHauler.body_parts, creepName, { memory: { role: roleHauler.role, action: 'moving', assignedTo: assignedHarvester ? assignedHarvester.id : undefined } });
    } else {
      let creepName = "Harvester" + Game.time;
      if(!areAllDestinationsFull()){
        result = spawn.spawnCreep(roleHarvester.body_parts, creepName, { memory: { role: roleHarvester.role, action: 'moving' } });
      }
    }
    if(areAllDestinationsFull){
      let creepName = "Builder" + Game.time;
      result = spawn.spawnCreep(roleBuilder.body_parts, creepName, { memory: { role: roleBuilder.role, building: false } });
    }
    if (result === OK) {
      console.log('Spawned');
  }

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      continue;
    }

    var creep = Game.creeps[name];

    if (creep.memory.role === 'harvester') {
      roleHarvester.harvester.run(creep);
    }

    if (creep.memory.role === 'hauler') {
      roleHauler.hauler.run(creep)
      }
    }

    if(creep.memory.role === 'builder'){
      roleBuilder.builder.run(creep)
    }
  }
};