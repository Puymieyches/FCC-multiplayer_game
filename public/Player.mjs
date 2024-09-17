class Player {
  constructor({x, y, score, id}) {
    this.x = x,
    this.y = y,
    this.score = score,
    this.id = id,
    this.width = 20,
    this.height = 20
  }

  movePlayer(dir, speed) {
    switch (dir) {
      case 'left':
        this.x -= speed;
        break;
      case 'right':
        this.x += speed;
        break;
      case 'up':
        this.y -= speed;
        break;
      case 'down':
        this.y += speed;
        break;
      default:
        break;
    }
  }

  collision(item) {
    return this.x < item.x + item.width &&
         this.x + this.width > item.x &&
         this.y < item.y + item.height &&
         this.y + this.height > item.y;
  }

  calculateRank(arr) {
    const sortedRanks = arr.slice().sort((a, b) => b.score - a.score);
    const currentRanking = sortedRanks.findIndex(player => player.id === this.id) + 1;
    console.log(sortedRanks);
        
    return `Rank: ${currentRanking}/${sortedRanks.length}`;
  }
}

export default Player;
