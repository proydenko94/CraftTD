const boardWidth = 600;
const boardHeight = 600;
const boardSize = {
    width: 20,
    height: 20
}
const cellWidth = boardWidth / boardSize.width;
const cellHeight = boardHeight / boardSize.height;
const towerHeight = cellHeight - 4;
const towerWidth = cellWidth - 4;
const enemyHeight = cellHeight - 4;
const enemyWidth = cellWidth - 4;
const $board = $(".board");
const tick = Math.floor(1000/60);
const towers = [];
const enemies = [];
function dist2d(p1,p2) {
    return Math.sqrt((p1[0]-p2[0])*(p1[0]-p2[0])+(p1[1]-p2[1])*(p1[1]-p2[1]));
}
let currentWave = 0;
function sendWave() {
    currentWave++;
    let cnt = 10;
    let enemiesIntrval = setInterval(()=>{
        enemies.push(createEnemy(currentWave));
        cnt--;
        if(cnt==0) {
            clearInterval(enemiesIntrval);
        }
    }, 1000) 
}
function initBoard() {
    $board.css({
        width: boardWidth,
        height: boardHeight
    })
    function createCell(){
        let $cell = $("<div class='cell'></div>");
        $cell.css({
            width: cellWidth,
            height: cellHeight,
            position: 'absolute',
            border: '1px solid #000'
        });
        return $cell;
    }
    
    for(let i = 0;i<boardSize.height;i++) {
        for(let j = 0 ; j < boardSize.width;j++) {
            let $cell = createCell();
            $cell.css({
                top: i*cellHeight,
                left: j*cellWidth
            })
            $cell.attr('id', `r${i}c${j}`);
            $board.append($cell)
        }
    }
}
class Tower {
    constructor(opt) {
        this.damage =opt.damage;
        this.attackSpeed = opt.attackSpeed;
        this.x=opt.x;
        this.y=opt.y;
        this.bulletSpeed= opt.bulletSpeed;
        this.critChance = opt.critChance,
        this.critDamage = opt.critDamage,
        this.width=opt.width;
        this.height = opt.height;
        this.range = opt.range
    }
    draw() {
        let $tower = $("<div class='tower'></div>");
        $tower.css({
            width: this.width,
            height: this.height,
            position: 'absolute',
            left: this.x*cellWidth+3,
            top: this.y*cellHeight+3
        })
        
        this.$el = $tower;
        
        $board.append($tower);
    }
    fire() {
        let fireInterval = setInterval(()=>{
            if(this.fireReload)return;
            let best = 2e12;
            let goal = null;
            
            for(let enemy of enemies) {
                // console.log(enemy);
                if(!enemy.position)continue;
                let dist = dist2d([this.y*cellWidth+3,this.y*cellHeight+3], enemy.position);
                // console.log(dist);
                if(best>dist && enemy.life>0) {
                    best = dist;
                    goal = enemy;
                }
            }
            
            best/=cellHeight;
            // console.log(best,goal);
            if(goal && best<=this.range) {
                this.shoot(goal);
                this.fireReload = true;
                setTimeout(()=>{
                    this.fireReload = false;
                }, tick/this.attackSpeed*100);
            }
            
        }, tick)
    }
    shoot(enemy) {
        let $bullet = $("<div class='bullet'></div>");
        let pos = [this.y*cellHeight+3,this.x*cellWidth+3];
        $bullet.css({
            position: 'absolute',
            transform: `translate(${this.x*cellWidth+3}px,${this.y*cellHeight+3}px)`,
            width: cellWidth/10,
            height: cellHeight/10,
            background: "#ff0",
            'border-radius': '2px'
        })
        
        let bullet = {
            damage: this.damage,
            bulletSpeed: this.bulletSpeed
        }
        if(Math.random()<this.critChance) {
            bullet.damage*=this.critDamage;
            bullet.isCrit = true;
        }
        let pxPerTick = bullet.bulletSpeed / boardSize.width;
        let bulletInterval = setInterval(()=>{
            // console.log(pos, enemy.position);
            let dy = Math.abs(pos[0] - enemy.position[0]);
            let dx = Math.abs(pos[1] - enemy.position[1]);
            let cx = (dx/(dx+dy));
            let cy = (dy/(dx+dy));
            if(pos[0]<enemy.position[0]) {
                pos[0]+=dy*pxPerTick;
            } else {
                pos[0]-=dy*pxPerTick;
            }
            if(pos[1]<enemy.position[1]) {
                pos[1]+=dx*pxPerTick;
            } else {
                pos[1]-=dx*pxPerTick;
            }
            if(dist2d(pos,enemy.position)<1) {
                console.log($bullet);
                clearInterval(bulletInterval);
                $bullet.remove();
                enemy.life-=bullet.damage;
                
                bullet = null;
                enemy.update();

                let isAlive = false;
                for(let enemy of enemies) {
                    if(enemy.life>0)isAlive = true;
                }
                if(!isAlive) {
                    while(enemies.length)enemies.pop();
                    sendWave();
                }
                return;
            }
            $bullet.css({

                transform: `translate(${pos[0]}px,${pos[1]}px)`,
            })
        }, tick/bullet.bulletSpeed)
        $board.append($bullet);
        
    }
}

class Block {
    constructor(opt) {
        
        this.x=opt.x;
        this.y=opt.y;
        this.width=opt.width;
        this.height = opt.height;
    }
    draw() {
        let $tower = $("<div class='block'></div>");
        $tower.css({
            width: this.width,
            height: this.height,
            position: 'absolute',
            left: this.x*cellWidth+3,
            top: this.y*cellHeight+3
        })
        
        this.$el = $block;
        
        $board.append($block);
    }
}


class Enemy {
    constructor(opt) {
        this.life =opt.life;
        this.maxLife = opt.life;
        this.speed = opt.speed;
        this.width=opt.width;
        this.height = opt.height;
        this.path = opt.path;
        // this.position = [this.path[0][0]*cellHeight+3, this.path[0][1]*cellWidth+3];
    }
    draw() {
        let $enemy = $("<div class='enemy'></div>");
        $enemy.css({
            width: this.width,
            height: this.height,
            position: 'absolute',
            transform: `translate(${this.path[0][0]*cellWidth+3}px, ${this.path[0][1]*cellHeight+3}px)`
        })
        let $indicator = $("<div class='indicator'></div>");
        let $life = $("<div class='life'></div>");
        $life.css({
            width: this.width-2,
            height: 3,
            position: 'absolute',
            top: 0,
            left: 0,
            background: '#0f0'
        })
        $indicator.css({
            width: this.width - 2,
            height: 3,
            position: 'absolute',
            top: 0,
            left: 0,
            border: '1px solid #000'
        })
        $indicator.append($life);
        $enemy.append($indicator);
        this.$el = $enemy;
        $board.append($enemy);
    }
    update() {
        console.log(this.life);
        if(this.life<=0) {
            this.$el.remove();
            // this = null;
            return;
        }
        console.log(this.life,this.maxLife,(this.width - 2));
        this.$el.find('.life').css({
            width:  this.life/this.maxLife*(this.width - 2)
        })
    }
    move() {

        let path = [];
        for(let i = 1;i<this.path.length;i++){
            let prev = [this.path[i-1][1]*cellWidth+3, this.path[i-1][0]*cellHeight+3];
            let cur = [this.path[i][1]*cellWidth+3, this.path[i][0]*cellHeight+3];
            for(let j = 0;j<tick;j++) {
                path.push([
                    Math.ceil(prev[0] + (cur[0] - prev[0])/tick*j)+1,
                    Math.ceil(prev[1] + (cur[1] - prev[1])/tick*j)+1
                ])
            }
        }
        let i = 0;
        let runInterval = setInterval(()=>{
            this.$el.css({
                transform: `translate(${path[i][0]}px, ${path[i][1]}px)`
            })
            this.position = path[i];
            i++;
            if(i==path.length) {
                clearInterval(runInterval);
            }
        }, tick/this.speed)
        
    }
    
}
function createTower({x,y}){

    let tower = new Tower({
        damage: 3,
        attackSpeed: 4,
        width: towerWidth,
        height: towerHeight,
        critChance: .8,
        critDamage: 2,
        bulletSpeed: 5,
        x: x-1,
        y: y-1,
        range: 6
    });
    tower.draw();
    tower.fire();
    return tower;
}
const route = [];
function createEnemy(level){
    
        let enemy = new Enemy({
            life: 10*level,
            speed: 0.5,
            width: enemyWidth,
            height: enemyHeight,
        });
        enemy.path = route;
        enemy.draw();
        enemy.move();
        return enemy;
    }


fetch("./maps/1.map")
.then(function(response) {
    return response.text();
})
.then(data=>{
    initBoard();
    let start,finish;
    const d = [[-1,0],[1,0],[0,-1],[0,1]];
    
    data = data.split('\n');
    let dist = [];
    for(let i = 0; i < data.length; i++) {
        dist.push([]);
        for(let j=0;j<data[i].length;j++) {
            dist[i][j]=0;
            let $cell = $board.find(`.cell#r${i}c${j}`);
            if(data[i][j]=='.') {
                $cell.css({
                    "background-image": `url(resources/grass.jpg)`,
                    "background-size": `cover`
                })
            } else if(data[i][j]=='#') {
                $cell.css({
                    "background-image": `url(resources/sand.jpg)`,
                    "background-size": `cover`
                })
            }
            if(data[i][j]=='s') {
                start = [i,j];
                dist[i][j] = 0;
            }
            if(data[i][j]=='f') {
                finish = [i,j];
            }

        }
    }
    let q = [start];
    dist[start[0]][start[1]]=1;
    while(q.length) {
        
        if(dist[finish[0]][finish[1]])break;
        let fr = q[0];
        q.shift();
        for(let i = 0;i<d.length;i++) {
            let pt = [fr[0]+d[i][0], fr[1]+d[i][1]];
            if(pt[0]<0 || pt[0]>boardSize.width || pt[1]<0 || pt[1]>boardSize.height) {
                continue;
            } else {
                if(!dist[pt[0]][pt[1]] && data[pt[0]][pt[1]]!='#') {
                    q.push(pt);
                    dist[pt[0]][pt[1]] = 1 + dist[fr[0]][fr[1]];
                    if(dist[finish[0]][finish[1]])break;
                }
            }
        }
    }
    let res = [];
    for(let i = 0;i<boardSize.height;i++){
        for(let j = 0;j<boardSize.width;j++) {
            if(dist[i][j]) {
                res.push({
                    value: dist[i][j],
                    point: [i,j]
                })
            }
        }
    }
    res.sort(function(a,b){
        return a.value - b.value;
    })
    for(let p of res) {
        route.push(p.point);
    }
    // console.log(route);
    towers.push(createTower({x: 10,y: 10}));
    towers.push(createTower({x: 10,y: 11}));
    
    sendWave();
    
    console.log(towers, enemies);
})

