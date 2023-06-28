module.exports.body_parts = [MOVE, WORK, WORK];
module.exports.role = 'harvester';

const getAdjacentPositions = (pos) => {
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

const BANNED_ZONE = 0xff;

module.exports.harvester = {
  run: function (creep) {
    function getDestinations() {
      return _.map(creep.room.find(FIND_SOURCES), function (src) {
        let nearbyHarvesters = src.pos.findInRange(FIND_MY_CREEPS, 1, {
          filter: (creep) => creep.memory.role === 'harvester' && creep.memory.action === 'harvesting',
        });
        let nearbyDangers = src.pos.findInRange(FIND_HOSTILE_CREEPS, 2);
    
        let freeSpaces = getAdjacentPositions(src.pos).filter((pos) => pos.lookFor(LOOK_TERRAIN)[0] !== 'wall');
    
        if (nearbyHarvesters.length < freeSpaces.length && nearbyDangers.length === 0) {
          let assignedHauler = _.find(Game.creeps, (creep) => creep.memory.role === 'hauler' && creep.memory.assignedTo === src.id);
          return { pos: src.pos, range: 1, freeSpaces: freeSpaces, assignedHauler: assignedHauler };
        }
      }).filter(Boolean);
    }
    
    const returnToBase = () =>{
      const spawn = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (src) => src.structureType === STRUCTURE_SPAWN,
      })[0];
      if(!creep.pos.isNearTo(spawn)){
        creep.moveTo(spawn)
      }else{
        creep.say("🧍")
      }
    }
    const destinations = getDestinations()
    let source = creep.pos.findClosestByRange(FIND_SOURCES);
    if(destinations.length === 0){
      if(creep.memory.action !== "harvesting"){
        let destination = creep.pos.findClosestByPath(destinations);
        if (destination) {
          let moveResult = creep.moveTo(destination.pos);
          if (moveResult === OK) {
            creep.memory.action = "moving";
          }
        }
        returnToBase()
      }
    }
    else{

      if(creep.memory.action === "harvesting" && !creep.pos.isNearTo(source)){
        creep.memory.action = "moving"
      }

      if(creep.pos.isNearTo(source)){
        creep.memory.action = "harvesting"
      }

      let ret = PathFinder.search(creep.pos, destinations, {
        plainCost: 2,
        swampCost: 10,
        roomCallback: function (roomName) {
          let room = Game.rooms[roomName];
          if (!room) {
            return new PathFinder;
          }
          let costs = new PathFinder.CostMatrix();
          room.find(FIND_STRUCTURES).forEach(function (structure) {
            if (structure.structureType === STRUCTURE_ROAD) {
              costs.set(structure.pos.x, structure.pos.y, 1);
            } else if (
              (structure.structureType !== STRUCTURE_CONTAINER &&
                structure.structureType !== STRUCTURE_RAMPART) ||
              !structure.my
            ) {
              costs.set(structure.pos.x, structure.pos.y, BANNED_ZONE);
            }
          });
          room.find(FIND_CREEPS).forEach(function (other) {
            costs.set(other.pos.x, other.pos.y, BANNED_ZONE);
          });
          return costs;
        },
      });

      let pos = ret.path[0];

      if(pos && creep.memory.action === "moving"){
        creep.move(creep.pos.getDirectionTo(pos));
      }
    }

    if(creep.memory.action === "harvesting"){
      let source = creep.pos.findClosestByRange(FIND_SOURCES);
      if (source) {
        if(creep.pos.findInRange(FIND_HOSTILE_CREEPS), 3){
          creep.memory.action = "moving"
        }
        creep.harvest(source);
        creep.say("⛏️")
        creep.memory.action = "harvesting"
      }
  }
  },
};

