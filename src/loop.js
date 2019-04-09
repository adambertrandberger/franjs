let useSetTimeout = false;
if (typeof requestAnimationFrame !== 'undefined' || useSetTimeout) {
    requestAnimationFrame = (f) => setTimeout(f, 16);
}

/*
 * Returns a loop which renders all components to a HTML Canvas
 */
function makeMainLoop(ctx, component) {
    const update = (time) => {
        if (window.image) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);            
            window.image.render(ctx);

            for (const obj of regBehs.keys()) {
                const behs = regBehs.get(obj);
                for (const prop of behs.keys()) {
                    const beh = behs.get(prop);
                    obj[prop] = beh.at(time)[0];
                }
            }
            
            if (window.checkEvents) {
                checkEvents(time);
            }
            timer.tick(time);
        }
    };

    return {
        init: makeUpdateRenderLoop(update),
    };
}

// registered behaviors
const regBehs = new Map();

// registerB :: Func<Behavior<alpha>> -> Action<alpha>
function registerB(obj, prop, beh=null) {
    if (beh === null)
        beh = obj[prop];
    beh = lift(beh);
    
    const existing = regBehs.get(obj);
    if (existing != null) {
        existing.set(prop, beh);
    } else {
        const map = new Map();
        map.set(prop, beh);
        regBehs.set(obj, map);
    }
}

let totalFrames = 0;
let startTime = new Date();
const getElapsedSeconds = () => {
    return (new Date().getTime() - startTime.getTime())/1000;
};
let fps = 0;
let countFpsUsingDelta = false;

/*
 * Creates a render loop for all animations
 */
const makeUpdateRenderLoop = (update) => {
    const MS_PER_UPDATE = 10; // update every 10ms

    window.loopTime = 0;
    
    return () => {
        let t0 = new Date();
        let deltaT = 0.0;

        const loop = () => {
            requestAnimationFrame(() => {
                if (countFpsUsingDelta) {
                    if(!startTime) {
                        startTime = Date.now();
                        fps = 0;
                    } else {
                        let delta = (Date.now() - lastCalledTime)/1000;
                        lastCalledTime = Date.now();
                        fps = (1/delta).toFixed(2);
                    }
                } else {
                    ++totalFrames;
                    fps = (totalFrames / getElapsedSeconds()).toFixed(2);
                }

                update(window.loopTime+=MS_PER_UPDATE);
                
                loop();
            });
        };
        loop();
    };
};
