const BANNED_ZONE = 0xff;
module.exports.body_parts = [CARRY, CARRY, MOVE];
module.exports.role = "hauler";

function getDestinations(creep){
  if (creep.store[RESOURCE_ENERGY] < creep.store.getCapacity()) {
    let assignedHarvester = Game.getObjectById(creep.memory.assignedTo);

    if (assignedHarvester) {
      let nearbyDangers = assignedHarvester.pos.findInRange(FIND_HOSTILE_CREEPS, 2);
      if (nearbyDangers.length === 0) {
        const droppedResources = creep.room.find(FIND_DROPPED_RESOURCES);
        const closestDroppedResource = creep.pos.findClosestByRange(droppedResources);
      
        if (closestDroppedResource) {
          const harvesterDistance = creep.pos.getRangeTo(assignedHarvester);
          const droppedResourceDistance = creep.pos.getRangeTo(closestDroppedResource);
      
          if (droppedResourceDistance < harvesterDistance) {
            return [{ pos: closestDroppedResource.pos, range: 1 }];
          }
        }
        return [{ pos: assignedHarvester.pos, range: 1 }];
      }
    }else {
      return _.map(
        creep.room.find(FIND_DROPPED_RESOURCES, {
          filter: (src) => src.resourceType === RESOURCE_ENERGY,
        }),
        (src) => {
          let nearbyDangers = src.pos.findInRange(FIND_HOSTILE_CREEPS, 2);
          if (nearbyDangers.length === 0) {
            return { pos: src.pos, range: 1 };
          }
          return null;
        }
      );
    }
    
  }else {
    const spawn = creep.room.find(FIND_MY_STRUCTURES, {
      filter: (src) => src.structureType === STRUCTURE_SPAWN,
    })[0];
    if (spawn) {
      return [{ pos: spawn.pos, range: 1 }];
    }
  }
}
module.exports.hauler = {
  run: function (creep) {
    const destinations = getDestinations(creep);
    let ret = PathFinder.search(creep.pos, destinations, {
      plainCost: 2,
      swampCost: 10,
      roomCallback: function (roomName) {
        let room = Game.rooms[roomName];
        if (!room) {
          return;
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
    if (pos) {
      creep.say("👟");
      creep.move(creep.pos.getDirectionTo(pos));
    }else {
      const source = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
      if (source && creep.store[RESOURCE_ENERGY] < creep.store.getCapacity()) {
        if (creep.pos.isNearTo(source)) {
          creep.say("✋");
          creep.pickup(source);
        } else {
          creep.moveTo(source);
        }
      }else{
        const spawn = creep.room.find(FIND_MY_STRUCTURES, {
          filter: (src) => src.structureType === STRUCTURE_SPAWN,
        })[0];

        if(spawn) {
          if (creep.pos.isNearTo(spawn)) {
            creep.transfer(spawn, RESOURCE_ENERGY);
          }
        }
      }
    }
  },
};
