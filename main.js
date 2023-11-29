/* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/

'use strict'
prompt
/**************************[TEMPLATE]***************************/
const update_fps = () => {
    fps.innerHTML = Math.round(1000/(Date.now()-now))
    now = Date.now()
}

const init_fps = () => {
    fps = document.createElement("a")
    fps.style.color = "lime"
    document.body.appendChild(fps)
    now = Date.now()
}

const init_canvas = () => {
    c   = document.getElementById("cvs")
    ctx = c.getContext("2d")
    c.width = window.innerWidth
    c.height = window.innerHeight
    W = c.width
    H = c.height
}

const main = () => {
    update_fps()
    update()
    clear()
    draw()
    requestAnimationFrame(main)
}


const clear = () => {
    c.width = c.width
}

window.onload = () => {
    init_fps()
    init_canvas()
    setup()
    requestAnimationFrame(main)
}

window.onresize = () => {
    c.width = window.innerWidth
    c.height = window.innerHeight
}

/***************************************************************/







/***************************[MAIN]******************************/


var fps, now, c, ctx, W, H, player, target_ray, target_point,
    enemy_ref, health_ref, rays, player_rays, view_points,
    intersects, joysticks, bullets, player_bullets, enemies,
    health, start_health, enemy_count, alive_enemies,
    enemy_shoot_interval, enemy_count = 10,
    shoot_cooldown = 500, shoot_time_frame, allies,
    start_health = 3, weapon = "gun", user_id,
    score = 0, score_ref, level

var moving_enemies = false;

var chat


var messages = [
    "Hello 👋",
    "What's up?",
    "This is great! 👍",
    "Good game 👌",
    "I gotta leave 😞",
    "Good bye 👋",
    ["[shotgun]", ()=>{change_weapon("shotgun")}],
    ["[gun]", ()=>{change_weapon("gun")}],
];



const setup = (first_load = 1) => {
    init_vars()
    if(first_load) {
        show_instructions()
        chat = create_live_chat_system("Vision", {}, messages,
        user_id,
        {background: "rgba(255,255,255,0.2", color: "#fff"},5);
        chat.write(user_id+" joined", "[Vision]")
        set_level(1)
    }
    
    create_map()        /*                  */
    create_enemies()    /* LEVEL specific   */
    create_allies()     /*                  */
    
    get_player_rays()
    add_event_listeners()
    enemy_ref = document.getElementById("enemies")
    health_ref = document.getElementById("health")
    score_ref = document.getElementById("score")
    health++; update_health()
}

const update = () => {
    shoot_time_frame -= 1000/60
    intersects = []
    player.update()
    get_player_rays()
    update_bullets()
    update_enemies()
    update_allies()
}

const draw = () => {
    draw_rays_and_poly()
    draw_target()
    draw_allies()
    draw_enemies()
    player.draw()
    draw_bullets()
    draw_joysticks()
}


/***************************************************************/



const init_vars = () => {
    rays = [], player_rays = 0
    view_points = [], intersects = []
    joysticks = {}
    bullets = [], player_bullets = []
    enemies = [], health = start_health,
    alive_enemies = 10, shoot_time_frame  = 200,
    allies = []
}







/***************************[CLASSES]***************************/

const create_player = (x,y) => {
    player = {
        p: new Vector(x,y), v: new Vector(0,-1), fov: 120,
        size: 5, color: "lime",
        update() {
            let color, hit = false
            let mv = joysticks["$0"]
            if(mv && mv.active) {
                let p = mv.vector.mult(0.05)
                let px = new Vector(this.p.x+p.x, this.p.y),
                    py = new Vector(this.p.x, this.p.y+p.y),
                    psx = new Vector(p.x,0),
                    psy = new Vector(0,p.y)
                if(!check_collision(px, this.size)) {
                    this.p = this.p.add(psx)
                } if(!check_collision(py, this.size)) {
                    this.p = this.p.add(psy)
                }
            } let lv = joysticks["$1"]
            if(lv && lv.active) {
                let v = lv.vector.norm
                if(Math.abs(v.x) > null) this.v = v
                target_ray = new Ray(this.p.x,this.p.y,
                                     this.v.x, this.v.y)
                let pr = player_rays
                let l = rays.length
                let ps = []
                for(let r of rays.slice(pr,l)) {
                    let i = intersection_point(target_ray,r)
                    if(i) ps.push([i,this.p.sub(i).length])
                } ps.sort((a,b)=>{
                    return parseInt(a[1])<parseInt(b[1])?-1:1}
                )
                target_point = ps[0][0]
                target_ray.draw_length = ps[0][1]
            }
            
            for(let bullet of bullets) {
                let d = bullet.p.sub(this.p).length
                let r = this.size + bullet.size
                if(d < r) {
                    color = "red"; hit = true
                    bullets.splice(bullets.indexOf(bullet),1)
                }
            } this.color = color
            if(hit) update_health()
        }, draw() {
            this.p.draw(ctx, this.color, this.size)
        }
    }
}


class Vector {
    constructor(x,y) {
        this.x = x; this.y = y
    }
    
    add(v) {
        return new Vector(this.x+v.x, this.y+v.y)
    }
    
    sub(v) {
        return new Vector(this.x-v.x, this.y-v.y)
    }
    
    mult(d) {
        return new Vector(this.x*d, this.y*d)
    }
    
    dot(v) {
        return this.x*v.x + this.y*v.y
    }
    
    get norm() {
        return new Vector(this.x/this.length,this.y/this.length)
    }
    
    get copy() {
        return new Vector(this.x, this.y)
    }
    
    get length() {
        return Math.hypot(this.x,this.y)
    }
    
    rotate(a) {
        let x = this.x; let y = this.y
        this.x = x*cos(a) + y*sin(a)
        this.y = -x*sin(a) + y*cos(a)
    }
    
    draw(cx = ctx, color = "lime", radius) {
        cx.fillStyle = color
        cx.beginPath()
        cx.arc(this.x, this.y, radius||1, 0, 2*Math.PI)
        cx.fill()
        cx.closePath()
    }
}


class Ray {
    constructor(px,py, vx,vy, length = 1e3) {
        this.p = new Vector(px,py)
        this.v = new Vector(vx,vy)
        this.length = length
        this.draw_length = length
    }
    
    get copy() {
        return new Ray(this.p.x,this.p.y, this.v.x,this.v.y,
                       this.length)
    }
    
    get q() {
        return this.p.add(this.v.norm.mult(
        this.draw_length || this.length))
    }
    
    draw(cx = ctx, color = "red", width = 1, ints = false,
         dp = false) {
        cx.strokeStyle = color
        cx.lineWidth = width
        cx.beginPath()
        let l = this.draw_length || this.length
        cx.moveTo(this.p.x, this.p.y)
        cx.lineTo(this.p.x+this.v.norm.x*l,
                  this.p.y+this.v.norm.y*l)
        cx.stroke()
        cx.closePath()
        if(ints && this.distances[0]) {
            if(dp) this.distances[0][1].draw(cx, 'lime', 2)
            if(!contains(intersects,this.distances[0][1]))
                intersects.push(this.distances[0][1])
        }
        // this.p.draw(cx, "blue")
        // this.q.draw(cx, "yellow")
    }
    
    get intersections() {
        let array = []
        let i = rays.indexOf(this)
        let s  = []; for(let r of rays) s.push(r.copy)
        s.splice(i, 1)
        for(let ray of rays.slice(player_rays,rays.length)) {
            let i = intersection_point(this, ray)
            if(i) array.push(i)
        } 
        if(array.length === 0) {
            this.draw_length = this.length
        }
        return array
    }
    
    get distances() {
        let array = []
        for(let intersection of this.intersections) {
            array.push([intersection.sub(this.p).length,
                        intersection])
        } array.sort((a,b)=>{return a[0]<b[0]?-1:1})
        return array
    }
}


class Bullet {
    constructor(p, v, color = "white", active = true) {
        this.p = p
        this.v = v.copy.norm.mult(3)
        this.color = color
        this.active = active
        this.size = 1.5
    }
    
    update() {
        if(this.active) {
            this.p = this.p.add(this.v)
            if(check_collision(this.p, this.size)) {
                let i = player_bullets.indexOf(this)
                let j = bullets.indexOf(this)
                if(i >= 0) player_bullets.splice(i,1)
                if(j >= 0) bullets.splice(j,1)
                this.active = false
            }
        }
    }
    
    draw() {
        if(this.active) {
            this.p.draw(ctx, this.color, this.size)
        }
    }
}


class Enemy {
    constructor(x,y) {
        this.p = new Vector(x,y)
        this.v = new Vector(0.7,0)
        this.alive = true
        this.size = 4
    }
    
    update() {
        for(let bullet of player_bullets) {
            let d = this.size + bullet.size
            if(this.p.sub(bullet.p).length < d && this.alive) {
                this.alive = false
                player_bullets.splice(
                player_bullets.indexOf(bullet),1)
                score_ref.innerHTML = "Score: "+ ++score
                if(score%10==0) chat.write(user_id+
                "'s score: "+score, "[Vision]")
                update_enemy_counter()
            }
        }
        
        if(moving_enemies && this.alive) {
            this.v.rotate(Math.floor(Math.random()*16)-8)
            let p = this.p.add(this.v)
            if(check_collision(p, this.size)) {
                this.v = this.v.mult(-1)
            } this.p = this.p.add(this.v)
        }
    }
    
    draw() {
        if(this.alive) this.p.draw(ctx, "#000", this.size)
        else this.p.draw(ctx, "#f00", this.size)
    }
}



class Ally {
    constructor(x,y, char = "") {
        this.p = new Vector(x,y); this.color = "yellow"
        this.size = 4; this.vision_radius = 60
        this.v = new Vector(-1.5,0); this.char = char
    }
    
    draw() {
        ctx.beginPath()
        ctx.arc(this.p.x, this.p.y, this.vision_radius, 
        0,2*Math.PI)
        ctx.closePath()
        ctx.fillStyle = "rgba(255,255,255,0.3)"
        ctx.fill()
        if(this.char != "") {
            ctx.fillStyle = this.color
            ctx.font = "14px Helivicia"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(this.char, this.p.x, this.p.y)
        } else this.p.draw(ctx, this.color, this.size)
    }
    
    update() {
        this.v.rotate(Math.floor(Math.random()*16)-8)
        let p = this.p.add(this.v)
        if(check_collision(p, this.size)) {
            this.v = this.v.mult(-1)
        } this.p = this.p.add(this.v)
    }
}





class Joystick {
    constructor(id, x, y, active = true) {
        this.id = id; this.active = active
        this.pos = new Vector(x,y)
        this._touch = new Vector(x,y)
        this._vector = new Vector(0,0)
    }
    
    set touch(vec) {
        this._touch = vec
        let v = this._touch.sub(this.pos)
        if(v.length > 40) {
            v = v.norm.mult(40)
            this._touch = this.pos.add(v)
        } this._vector = v
    } get vector() {return this._vector}
    
    draw(cx = ctx) {
        if(this.active) {
            let p = this.pos; let t = this._touch
            cx.strokeStyle = "lime"
            cx.beginPath()
            cx.arc(p.x,p.y,40,0,2*Math.PI); cx.stroke()
            cx.closePath(); cx.beginPath()
            cx.arc(t.x,t.y,20,0,2*Math.PI); cx.stroke()
            cx.closePath()
            if(this.info) {
                cx.font = "12px Helivicia"
                cx.textAlign = "center"
                cx.textBaseline = "middle"
                cx.fillStyle = "lime"
                cx.fillText(this.info, p.x, p.y)
            }
        }
    }
}






/***************************************************************/












/* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/

















/*************************[FUNCTIONS]***************************/







const show_instructions = () => {
    alert("Use the left side of the screen to move the player"+
          " and the right side to look around. "+
          "Tapping on the right side will shoot "+
          "a bullet.\nThere are 10 enemies, which are black "+
          "and will shoot black bullets at you. You can only "+
          "see them when you are looking at them. You have "+
          "3 health points to kill all enemies. Dead enemies "+
          "are red.\n\nComment your "+
          "high score 🤔 🐶."+
          "\n\n Connectiom to DB is pretty slow, give it "+
          "some time to load :)")
    
    var r = Date.now().toString(); var l = r.length;
    var def = r.slice(l-5,l)
    user_id = prompt("Enter your name: ",def) || ""
    user_id = user_id.length === 0? def: user_id
    user_id = user_id.toString().replace(/\./g, "_")
    .replace(/ /g, "_").replace(/-/g, "_")
}



const set_level = value => {
    level = value
    if(level >= 3) moving_enemies = true
    if(level%2 == 1) create_player(W/2, H/2+12)
    else create_player(7/8*W, 7/8*H)
}



const reset = state => {
    clearInterval(enemy_shoot_interval)
    if(state == "won") {
        let o = enemy_count
        let n = o+2; enemy_count = n
        alert(`You killed all ${o} enemies. The game will `+
              `restart with ${n} enemies.`)
        set_level(++level)
    }
    else {
        let o = enemy_count
        let n = o==5?5:o-2; enemy_count = n
        alert(`You lost all hitpoints trying to kill `+
              `${o} enemies. The game will `+
              `restart with ${n} enemies.`)
        chat.write(user_id+"'s score: "+score, "[Vision]")
        set_level(--level)
        score = 0
        score_ref.innerHTML = "Score: 0"
    }
    
    setup(0)
    
    update_enemy_counter()
}


const update_enemy_counter = () => {
    alive_enemies = 0
    for(let enemy of enemies) {
        if(enemy.alive) alive_enemies++
    } enemy_ref.innerHTML = "Enemies: "+alive_enemies
    if(alive_enemies === 0) setTimeout(()=>{reset("won")},200)
}


const update_health = () => {
    if(health > 1) health--
    else {
        setTimeout(()=>{reset("lost")},200)
    }
    health_ref.innerHTML = ""
    for(let i = 0; i < health; i++) health_ref.innerHTML += "♥"
}


const create_enemies = () => {
    for(let i = 0; i < enemy_count; i++) {
        let x = Math.floor((W-40)*Math.random())+20
        let y = Math.floor((H-40)*Math.random())+20
        let p = new Vector(x,y)
        if(check_collision(p, new Enemy(p.x,p.y).size)) {
            i--
        } else {
            enemies.push(new Enemy(p.x,p.y))
        }
    }
    
    enemy_shoot_interval = setInterval(()=>{
        for(let enemy of enemies) {
            setTimeout(()=>{
                let b = new Bullet(enemy.p,
                player.p.sub(enemy.p))
                b.color = "black"
                if(enemy.alive) bullets.push(b)
            },
            enemies.indexOf(enemy)*500)
        }
    }, enemy_count*500)
}



const add_event_listeners = () => {
    window.addEventListener("touchstart", touch_start)
    window.addEventListener("touchmove", touch_move)
    window.addEventListener("touchend", touch_end)
    window.addEventListener("touchcancel", touch_cancel)
}

messages.push(["[score]", ()=>{chat.write(user_id+"'s score: "+score, "[Vision]")}])




const create_allies = () => {
    allies.push(new Ally(player.p.x, player.p.y-50, "🐶"))
    
    if(level >= 3)
        allies.push(new Ally(player.p.x, player.p.y+50, "🐶"))
}

const update_allies = () => {
    for(let ally of allies) ally.update()
}

const draw_allies = () => {
    for(let ally of allies) ally.draw()
}



/* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/


const draw_rays_and_poly = () => {
    for(let ray of rays.slice(player_rays,rays.length))
        ray.draw()
    for(let ray of rays.slice(0,player_rays))
        ray.draw(ctx, "rgba(255,0,0, 0)", 0, 1)
    draw_poly(intersects)
}

const draw_target = () => {
    if(target_ray) {
        ctx.save(); ctx.setLineDash([5,10])
        target_ray.draw(); ctx.restore()
        if(target_point) target_point.draw(ctx, "lime", 2)
    }
}

const draw_joysticks = () => {
    for(let i in joysticks)
        joysticks[i].draw()
}




/* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/

const change_weapon = wp => {
    weapon = wp || "gun"
    if(weapon == "gun") shoot_cooldown = 500
    if(weapon == "shotgun") shoot_cooldown = 1500
}


const player_shoot = () => {
    if(weapon == "gun") {
        player_bullets.push(new Bullet(player.p, player.v))
    } else if(weapon == "shotgun") {
        let v = player.v.copy
        add_player_bullet(player.p, v)
        v.rotate(-10); add_player_bullet(player.p, v)
        v.rotate(20); add_player_bullet(player.p, v)
    }
}

const add_player_bullet = (p,v) => {
    player_bullets.push(new Bullet(p, v))
}





const intersection_point = (g, h) => {
    if(!collinear(g.v, h.v)) {
        if(g.v.x === 0) g.v.x = 1e-15
        if(h.v.y === 0) h.v.y = 1e-15
        let s = (((g.p.y-h.p.y)/(h.v.y))+(((g.v.y*h.p.x)-
                (g.v.y*g.p.x))/(h.v.y*g.v.x)))/
                (1-(g.v.y*h.v.x)/(h.v.y*g.v.x))
        
        let point = h.p.add(h.v.mult(s))
        let look = point.sub(g.p)
        let wall = point.sub(h.p)
        
        if(look.length <= g.length) {
            if(wall.length <= h.length) {
                if(g.v.add(look).length > g.v.sub(look).length &&
                   h.v.add(wall).length > h.v.sub(wall).length) {
                    g.draw_length = look.length
                    return point
                }
            }
        }
    }
}


const collinear = (v_1, v_2) => {
    let r = v_1.x / v_2.x
    if(r*v_2.y == v_1.y) return true
    return false
}

const get_player_rays = () => {
    let pr = []
    rays.splice(0,player_rays)
    player_rays = 0
    for(let r of rays) {
        let v = r.p.sub(player.p); v.rotate(.1)
        let u = v.copy; u.rotate(-.2)
        let r1 = new Ray(player.p.x, player.p.y, v.x,v.y)
        let r2 = new Ray(player.p.x, player.p.y, u.x,u.y)
        v = r.q.sub(player.p); v.rotate(.1)
        u = v.copy; u.rotate(-.2)
        let r3 = new Ray(player.p.x, player.p.y, v.x,v.y)
        let r4 = new Ray(player.p.x, player.p.y, u.x,u.y)
        pr.push(r3,r1,r2,r4)
        player_rays += 4
    }
    let v = player.v.copy; v.rotate(-player.fov/2)
    let u = player.v.copy; u.rotate( player.fov/2)
    pr.push(new Ray(player.p.x, player.p.y, v.x,v.y))
    pr.push(new Ray(player.p.x, player.p.y, u.x,u.y))
    player_rays += 2
    pr.push(...rays)
    rays = [...pr]
}

const contains = (array, vector) => {
    for(let v of array) {
        if(v.x == vector.x && v.y == vector.y) {
            return true
        }
    } return false
}

const draw_poly = (array, cx = ctx, fill) => {
    let vec = player.v.norm || new Vector(1,0)
    cx.fillStyle = fill || "rgba(255,255,255, 0.3)"
    cx.beginPath()
    let sorted = sort_by_angle(array,vec)
    
    let indices = [], i = 0, j = 0
    for(let p of sorted) {
        let a = angle(p.sub(player.p), player.v)
        if(a-1 < player.fov/2) {
            indices.push(i)
        } if(a+1 > 360-player.fov/2) {
            indices.splice(j++,0,i)
        } i++
    }

    cx.moveTo(player.p.x, player.p.y)
    for(let i of indices) {
        ctx.lineTo(sorted[i].x,sorted[i].y)
    } cx.closePath()
    cx.fill()
}



const update_bullets = () => {
    for(let bullet of bullets) bullet.update()
    for(let bullet of player_bullets) bullet.update()
}

const draw_bullets = () => {
    for(let bullet of bullets) bullet.draw()
    for(let bullet of player_bullets) bullet.draw()
}


const update_enemies = () => {
    for(let enemy of enemies) enemy.update()
}

const draw_enemies = () => {
    for(let enemy of enemies) enemy.draw()
}


const angle = (v, u) => {
    let value = -deg(Math.atan2(v.x*u.y-v.y*u.x,
    v.x*u.x+v.y*u.y))
    return value < 0? 360-Math.abs(value): value
}

const sort_by_angle = (array,vec) => {
    let a = []
    for(let v of array) a.push(v.copy)
    a.sort((a,b)=>{return angle(a.sub(player.p),vec) >
    angle(b.sub(player.p),vec)?1:-1})
    return a
}


const get_color_sum = (cx, pos, radius) => {
    return sum(cx.getImageData(pos.x, pos.y,radius, radius).data)
}

const check_collision = (p,d) => {
    for(let ray of rays.slice(player_rays, rays.length)) {
        let v = ray.v
        let u = p.sub(ray.p)
        let a = angle(v,u)
        let b = u.length
        if((Math.abs(b*sin(a))<d) && (b<ray.length) &&
        (a<95 || a> 265) || b < d)
            return true
    } return false
}










const touch_start = e => {
    let touches = e.changedTouches
    for(let j = 0; j < touches.length; j++) {
        let i = touches[j].clientX < W/2? 0: 1
        joysticks["$"+i] = new Joystick(
            touches[j].identifier,
            touches[j].clientX, touches[j].clientY
        ); joysticks["$"+i].info = i==1?"look":"move"
    }
}

const touch_move = e => {
    let c = e.changedTouches
    for(let j = 0; j < c.length; j++) {
        for(let i in joysticks) {
            if(c[j].identifier == joysticks[i].id) {
                joysticks[i].touch = new Vector(c[j].clientX,
                                                c[j].clientY)
            }
        }
    }

}

const touch_end = e => {
    let c = e.changedTouches
    let shoot = false
    for(let j = 0; j < c.length; j++) {
        for(let i in joysticks) {
            if(c[j].identifier == joysticks[i].id &&
            joysticks[i].active) {
                joysticks[i].active = false
                if(i=="$1") {
                    shoot = true
                    target_ray = null
                }
            }
        }
    } if(shoot && shoot_time_frame < 0) {
        player_shoot()
        shoot_time_frame = shoot_cooldown
    }
}

const touch_cancel = e => {
    touch_end(e)
}


const print = s => console.log(JSON.stringify(s))
const deg = (rad) => rad*180/Math.PI
const rad = (deg) => deg*Math.PI/180
const cos = a => Math.cos(rad(a))
const sin = a => Math.sin(rad(a))
const sum = (arr) => {
    var sum = 0
    for(let e of arr) sum += e
    return sum
}


/* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/

const create_map = () => {
    let d = 20
    rays.push(new Ray(d,d, 0,1, H-2*d))
    rays.push(new Ray(W-d,d, 0,1, H-2*d))
    rays.push(new Ray(d,d, 1,0, W-2*d))
    rays.push(new Ray(d,H-d, 1,0, W-2*d))
    
    if(level%2 == 1) {
        rays.push(new Ray(W/2-20, H/2-20, 0,1, 40))
        rays.push(new Ray(W/2-20, H/2-20, 1,0, 10))
        rays.push(new Ray(W/2+20, H/2-20, -1,0, 10))
        rays.push(new Ray(W/2+20, H/2-20, 0,1, 40))
        rays.push(new Ray(W/2-20, H/2+20, 1,0, 40))
        rays.push(new Ray(d,H/4, 1,0, W/3))
        rays.push(new Ray(W-W/3-d,3*H/4, 1,0, W/3))
        rays.push(new Ray(2*W/3,H/3, 0,1, H/3))
        rays.push(new Ray(2*W/3,H/3, -1,0, W/8))
        rays.push(new Ray(W/4,2*H/4, 0,1, H/3))
        rays.push(new Ray(W/4,H-H/3, 1,0, W/8))   
    } else /* if(level%2 == 0) */ {
        rays.push(new Ray(3/5*W, H-d, 0,-1, H/4))
        rays.push(new Ray(3/5*W-W/3, 3/4*H-d, 1,0, W/5-d/2-10+W/3))
        rays.push(new Ray(d, 7/8*H-d, 1,0, 2/5*W))
        rays.push(new Ray(W-d, 3/4*H-d, -1,0, W/5-d/2-10))
        rays.push(new Ray(d, 3/8*H, 1,0, 2/5*W))
        rays.push(new Ray(2/5*W+d, 5/8*H, 0,-1, 1/4*H))
        rays.push(new Ray(2/5*W+d, d, 0,1, 3/20*W))
        rays.push(new Ray(3/5*W+d, 1/2*H, 0,-1, 3/10*W))
        rays.push(new Ray(3/5*W+d, 1/2*H, 1,0, W-d-(3/5*W+d)))
    }
}


/* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/