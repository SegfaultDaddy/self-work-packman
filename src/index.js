const canvas = document.getElementById("GameCanvas")
const canvasContext = canvas.getContext("2d")
const scoreItem = document.getElementById("ScoreItem")

canvas.width = window.innerWidth / 2
canvas.height = canvas.width

const speed = 4
const ghostSpeed = 2

const keys = {w: {pressed: false}, 
              a: {pressed: false},
              s: {pressed: false},
              d: {pressed: false}}

function drawBackground()
{
    canvasContext.fillStyle = "black"
    canvasContext.fillRect(0, 0, canvas.width, canvas.height)
}

class Boundary
{
    constructor({position, image})
    {
        this.position = position
        this.width = Boundary.width 
        this.height = Boundary.height 
        this.image = image
    }

    draw()
    {
        canvasContext.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
    }
    
    static width = 40;
    static height = 40;
}

class Player
{
    constructor({position, velocity})
    {
        this.position = position
        this.velocity = velocity
        this.radius = 15 
        this.radians = 0.75
        this.openRate = 0.12
        this.rotation = 0
    }

    draw()
    {
        canvasContext.save();
        canvasContext.translate(this.position.x, this.position.y);
        canvasContext.rotate(this.rotation);
        canvasContext.translate(-this.position.x, -this.position.y);
        canvasContext.beginPath();
        canvasContext.arc(
        this.position.x,
        this.position.y,
        this.radius,
        this.radians,
        Math.PI * 2 - this.radians
        );
        canvasContext.lineTo(this.position.x, this.position.y);
        canvasContext.fillStyle = "yellow";
        canvasContext.fill();
        canvasContext.closePath();
        canvasContext.restore();
    }

    update()
    {
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        if(this.radians < 0  ||
           this.radians > 0.75)
        {
            this.openRate = -this.openRate
        }

        this.radians += this.openRate
    }
}

class Ghost
{
    constructor({position, velocity, color = "red", eyes="black"})
    {
        this.position = position
        this.velocity = velocity
        this.color = color
        this.eyes = eyes;
        this.radius = 15
        this.prevCollisions = []
        this.scared = false
    }

    draw()
    {
        canvasContext.beginPath();
        canvasContext.arc(this.position.x, this.position.y, this.radius, 3, 6.4);
        canvasContext.lineTo(this.position.x + this.radius, this.position.y + this.radius);
        canvasContext.lineTo(this.position.x + this.radius / 2,
                             this.position.y + this.radius / 2);
        canvasContext.lineTo(this.position.x, this.position.y + this.radius);
        canvasContext.lineTo(this.position.x - this.radius / 2,
                             this.position.y + this.radius / 2);
        canvasContext.lineTo(this.position.x - this.radius, this.position.y + this.radius);
        canvasContext.fillStyle = this.scared ? "blue" : this.color;
        canvasContext.fill();
        canvasContext.closePath();

        canvasContext.beginPath();
        canvasContext.arc(this.position.x - 5, this.position.y - 4, 
                          Math.floor(this.radius / 4), 0, Math.PI * 2);
        canvasContext.fillStyle = this.scared ? "white" : this.eyes;
        canvasContext.fill();
        canvasContext.closePath();
        canvasContext.beginPath();
        canvasContext.arc(this.position.x + 5, this.position.y - 4,
                          Math.floor(this.radius / 4), 0, Math.PI * 2);
        canvasContext.fillStyle = this.scared ? "white" : this.eyes;
        canvasContext.fill();
        canvasContext.closePath();
    }

    update()
    {
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
    }
}

class Pellet
{
    constructor({position})
    {
        this.position = position
        this.radius = 3
    }

    draw()
    {
        canvasContext.beginPath()
        canvasContext.arc(this.position.x, this.position.y, 
                          this.radius, 0, Math.PI * 2)

        canvasContext.fillStyle = "white"; 

        canvasContext.fill(); 
        canvasContext.closePath()
    }
}

class PowerUp
{
    constructor({position})
    {
        this.position = position
        this.radius = 8
    }

    draw()
    {
        canvasContext.beginPath()
        canvasContext.arc(this.position.x, this.position.y, 
                          this.radius, 0, Math.PI * 2)

        canvasContext.fillStyle = "white"; 

        canvasContext.fill(); 
        canvasContext.closePath()
    }
}

const ghosts = [new Ghost({position: {x: Boundary.width * 6 + Boundary.width / 2, 
                                      y: Boundary.height + Boundary.height / 2}, 
                           velocity: {x: ghostSpeed, y: 0},
                           color: "red", 
                           eyes: "black"}),
                new Ghost({position: {x: Boundary.width * 6 + Boundary.width / 2, 
                                      y: Boundary.height * 3 + Boundary.height / 2}, 
                           velocity: {x: ghostSpeed, y: 0},
                           color:"green",
                           eyes: "black"}),
                new Ghost({position: {x: Boundary.width * 6 + Boundary.width / 2, 
                                      y: Boundary.height * 5 + Boundary.height / 2}, 
                           velocity: {x: ghostSpeed, y: 0},
                           color:"blue",
                           eyes: "black"})]
const pellets = []
const boundaries = []
const powerUps = []
const player = new Player({position: {x: Boundary.width + Boundary.width / 2, y: Boundary.height + Boundary.height / 2}, 
                           velocity: {x: 0, y: 0}})

function createImage(src)
{
    const image = new Image()
    image.src = src
    return image
}

const map = [['1', '-', '-', '-', '-', '-', '-', '-', '-', '-', '2'],
             ['|', '.', '.', '.', '.', '.', '.', '.', '.', 'p', '|'],
             ['|', '.', 'b', '.', '[', '7', ']', '.', 'b', '.', '|'],
             ['|', '.', '.', '.', '.', '_', '.', '.', '.', '.', '|'],
             ['|', '.', '[', ']', '.', '.', 'p', '[', ']', '.', '|'],
             ['|', '.', '.', '.', '.', '^', '.', '.', '.', '.', '|'],
             ['|', '.', 'b', '.', '[', '+', ']', '.', 'b', '.', '|'],
             ['|', '.', '.', '.', '.', '_', '.', '.', '.', '.', '|'],
             ['|', '.', '[', ']', '.', '.', '.', '[', ']', '.', '|'],
             ['|', '.', '.', '.', '.', '^', '.', '.', '.', '.', '|'],
             ['|', '.', 'b', '.', '[', '5', ']', '.', 'b', '.', '|'],
             ['|', '.', '.', '.', '.', '.', '.', '.', '.', 'p', '|'],
             ['4', '-', '-', '-', '-', '-', '-', '-', '-', '-', '3']]

map.forEach((row, i) => 
            {
                row.forEach((symbol, j) => 
                            {
                                switch (symbol) 
                                {
                                case '-':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: Boundary.width * j,
                                        y: Boundary.height * i
                                        },
                                        image: createImage('./asset/pipeHorizontal.png')
                                    })
                                    )
                                    break
                                case '|':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: Boundary.width * j,
                                        y: Boundary.height * i
                                        },
                                        image: createImage('./asset/pipeVertical.png')
                                    })
                                    )
                                    break
                                case '1':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: Boundary.width * j,
                                        y: Boundary.height * i
                                        },
                                        image: createImage('./asset/pipeCorner1.png')
                                    })
                                    )
                                    break
                                case '2':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: Boundary.width * j,
                                        y: Boundary.height * i
                                        },
                                        image: createImage('./asset/pipeCorner2.png')
                                    })
                                    )
                                    break
                                case '3':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: Boundary.width * j,
                                        y: Boundary.height * i
                                        },
                                        image: createImage('./asset/pipeCorner3.png')
                                    })
                                    )
                                    break
                                case '4':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: Boundary.width * j,
                                        y: Boundary.height * i
                                        },
                                        image: createImage('./asset/pipeCorner4.png')
                                    })
                                    )
                                    break
                                case 'b':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: Boundary.width * j,
                                        y: Boundary.height * i
                                        },
                                        image: createImage('./asset/block.png')
                                    })
                                    )
                                    break
                                case '[':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: j * Boundary.width,
                                        y: i * Boundary.height
                                        },
                                        image: createImage('./asset/capLeft.png')
                                    })
                                    )
                                    break
                                case ']':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: j * Boundary.width,
                                        y: i * Boundary.height
                                        },
                                        image: createImage('./asset/capRight.png')
                                    })
                                    )
                                    break
                                case '_':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: j * Boundary.width,
                                        y: i * Boundary.height
                                        },
                                        image: createImage('./asset/capBottom.png')
                                    })
                                    )
                                    break
                                case '^':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: j * Boundary.width,
                                        y: i * Boundary.height
                                        },
                                        image: createImage('./asset/capTop.png')
                                    })
                                    )
                                    break
                                case '+':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: j * Boundary.width,
                                        y: i * Boundary.height
                                        },
                                        image: createImage('./asset/pipeCross.png')
                                    })
                                    )
                                    break
                                case '5':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: j * Boundary.width,
                                        y: i * Boundary.height
                                        },
                                        color: 'blue',
                                        image: createImage('./asset/pipeConnectorTop.png')
                                    })
                                    )
                                    break
                                case '6':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: j * Boundary.width,
                                        y: i * Boundary.height
                                        },
                                        color: 'blue',
                                        image: createImage('./asset/pipeConnectorRight.png')
                                    })
                                    )
                                    break
                                case '7':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: j * Boundary.width,
                                        y: i * Boundary.height
                                        },
                                        color: 'blue',
                                        image: createImage('./asset/pipeConnectorBottom.png')
                                    })
                                    )
                                    break
                                case '8':
                                    boundaries.push(
                                    new Boundary({
                                        position: {
                                        x: j * Boundary.width,
                                        y: i * Boundary.height
                                        },
                                        image: createImage('./asset/pipeConnectorLeft.png')
                                    })
                                    )
                                    break
                                case '.':
                                    pellets.push(
                                    new Pellet({
                                        position: {
                                        x: j * Boundary.width + Boundary.width / 2,
                                        y: i * Boundary.height + Boundary.height / 2
                                        }
                                    })
                                    )
                                    break
                                case 'p':
                                    powerUps.push(
                                    new PowerUp({
                                        position: {
                                        x: j * Boundary.width + Boundary.width / 2,
                                        y: i * Boundary.height + Boundary.height / 2
                                        }
                                    })
                                    )
                                    break

                                }
                            })
            })

function collisionCircleRectangle({circle, rectangle})
{
    const padding = Boundary.width / 2 - circle.radius - 1
    return circle.position.y - circle.radius + circle.velocity.y <= rectangle.position.y + rectangle.height + padding &&
           circle.position.x + circle.radius + circle.velocity.x >= rectangle.position.x - padding &&
           circle.position.y + circle.radius + circle.velocity.y >= rectangle.position.y - padding && 
           circle.position.x - circle.radius + circle.velocity.x <= rectangle.position.x + rectangle.width + padding
}

function checkBoundaries(x, y)
{
    for(let i = 0; i < boundaries.length; ++i)
    {
        const boundary = boundaries[i]
        if(collisionCircleRectangle({circle: {...player, velocity: {x: x, y: y}}, rectangle: boundary}))
        {
            return true
        }
    }
    return false
}

let score = 0
let lastKey = ""

let animationID = 0
function animate()
{
    animationID = window.requestAnimationFrame(animate)
    canvasContext.clearRect(0, 0, canvas.width, canvas.height)
    drawBackground() 

    if(keys.w.pressed && lastKey === "w")
    {
        if(checkBoundaries(0, -speed))
        {
            player.velocity.y = 0
        }
        else
        {
            player.velocity.y = -speed
        }
    }
    else if(keys.a.pressed && lastKey === "a")
    {
        if(checkBoundaries(-speed, 0))
        {
            player.velocity.x = 0
        }
        else
        {
            player.velocity.x = -speed
        }
    }
    else if(keys.s.pressed && lastKey ==="s")
    {
        if(checkBoundaries(0, speed))
        {
            player.velocity.y = 0
        }
        else
        {
            player.velocity.y = speed
        }
    }
    else if(keys.d.pressed && lastKey === "d")
    {
        if(checkBoundaries(speed, 0))
        {
            player.velocity.x = 0
        }
        else
        {
            player.velocity.x = speed
        }
    }

    for(let i = ghosts.length - 1; 0 <= i; i--)
    {
        const ghost = ghosts[i]

        if(Math.hypot(ghost.position.x - player.position.x, 
                      ghost.position.y - player.position.y) < ghost.radius + player.radius)
        {
            if(ghost.scared)
            {
                ghosts.splice(i, 1)
            }
            else
            {
                cancelAnimationFrame(animationID)
            }
        }
    }

    if(pellets.length === 0)
    {
        cancelAnimationFrame(animationID)
    }
     
    for(let i = pellets.length - 1; 0 <= i; --i)
    {
        const pellet = pellets[i]
        pellet.draw()

        if(Math.hypot(pellet.position.x - player.position.x, 
            pellet.position.y - player.position.y) < pellet.radius + player.radius)
        {
            pellets.splice(i, 1)
            score += 10
            scoreItem.innerHTML = score
        }
    }

    for(let i = powerUps.length - 1; 0 <= i; --i)
    {
        const powerUp = powerUps[i]
        powerUp.draw()

        if(Math.hypot(powerUp.position.x - player.position.x, 
            powerUp.position.y - player.position.y) < powerUp.radius + player.radius)
        {
            powerUps.splice(i, 1)

            ghosts.forEach((ghost) => 
                            {
                                ghost.scared = true

                                setTimeout(() => {ghost.scared = false}, 5000)
                            })
        }
    }

    boundaries.forEach((boundary) => 
                       {
                        boundary.draw()

                        if(collisionCircleRectangle({circle: player, rectangle: boundary}))
                        {
                            player.velocity = {x: 0, y: 0}
                        }
                       })

    ghosts.forEach((ghost) => 
                   {
                        ghost.update()
                                                
                        const collisions = []
                        boundaries.forEach((boundary) => 
                                            {
                                                if(!collisions.includes("right") &&
                                                    collisionCircleRectangle({circle: {...ghost, velocity: {x: ghostSpeed, y: 0}}, rectangle: boundary})) 
                                                {
                                                    collisions.push("right")
                                                }
                                                if(!collisions.includes("left") && 
                                                    collisionCircleRectangle({circle: {...ghost, velocity: {x: -ghostSpeed, y: 0}}, rectangle: boundary}))
                                                {
                                                    collisions.push("left")
                                                }
                                                if(!collisions.includes("down") &&
                                                    collisionCircleRectangle({circle: {...ghost, velocity: {x: 0, y: ghostSpeed}}, rectangle: boundary}))
                                                {
                                                    collisions.push("down")
                                                }
                                                if(collisionCircleRectangle({circle: {...ghost, velocity: {x: 0, y: -ghostSpeed}}, rectangle: boundary}) &&
                                                  !collisions.includes("up"))
                                                {
                                                    collisions.push("up")
                                                }
                                            })
                        if(collisions.length > ghost.prevCollisions.length)
                        {
                            ghost.prevCollisions = collisions 
                        }

                        if(collisions.toString() !== ghost.prevCollisions.toString())
                        {
                            if(ghost.velocity.x > 0)
                            {
                                ghost.prevCollisions.push("right")
                            }
                            else if(ghost.velocity.x < 0)
                            {
                                ghost.prevCollisions.push("left")
                            }
                            else if(ghost.velocity.y < 0)
                            {
                                ghost.prevCollisions.push("up")
                            }
                            else if(ghost.velocity.y > 0)
                            {
                                ghost.prevCollisions.push("down")
                            }

                            const pathways = ghost.prevCollisions.filter((collision) => {return !collisions.includes(collision)})
                            const direction = pathways[Math.floor(Math.random() * pathways.length)]

                            switch(direction)
                            {
                                case "down":
                                    ghost.velocity.y = ghostSpeed
                                    ghost.velocity.x = 0
                                    break
                                case "up":
                                    ghost.velocity.y = -ghostSpeed
                                    ghost.velocity.x = 0
                                    break
                                case "right":
                                    ghost.velocity.y = 0
                                    ghost.velocity.x = ghostSpeed
                                    break
                                case "left":
                                    ghost.velocity.y = 0
                                    ghost.velocity.x = -ghostSpeed
                                    break
                            }

                            ghost.prevCollisions = []
                        }
                   })
    
    player.update()
    if(player.velocity.x > 0)
    {
        player.rotation = 0
    }
    else if(player.velocity.x < 0)
    {
        player.rotation = Math.PI
    }
    else if(player.velocity.y < 0)
    {
        player.rotation = Math.PI * 1.5
    }
    else if(player.velocity.y > 0)
    {
        player.rotation = Math.PI * 0.5
    }
}

animate()
window.addEventListener("keydown", ({key}) => 
                                   {
                                    switch(key)
                                    {
                                        case "w":
                                            keys.w.pressed = true
                                            lastKey = "w"
                                            break;
                                        case "a":
                                            keys.a.pressed = true
                                            lastKey = "a"
                                            break;
                                        case "s":
                                            keys.s.pressed = true
                                            lastKey = "s"
                                            break;
                                        case "d":
                                            keys.d.pressed = true
                                            lastKey = "d"
                                            break;
                                    }
                                   })

window.addEventListener("keyup", ({key}) => 
                                   {
                                    switch(key)
                                    {
                                        case "w":
                                            keys.w.pressed = false
                                            break;
                                        case "a":
                                            keys.a.pressed = false
                                            break;
                                        case "s":
                                            keys.s.pressed = false 
                                            break;
                                        case "d":
                                            keys.d.pressed = false 
                                            break;
                                    }
                                   })