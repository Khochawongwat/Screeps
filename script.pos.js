module.exports.getAdjacentPositions = (pos) => {
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
  console.log("PASSED")
  return adjacentPositions;
}