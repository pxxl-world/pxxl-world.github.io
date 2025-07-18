
// use std::{fmt::{self, Debug}, iter::Enumerate, time::Duration};

use spacetimedb::{reducer, table, Identity, ReducerContext, ScheduleAt, SpacetimeType, Table, TimeDuration, Timestamp};


// #[derive(Debug)]
#[table(name = person, public)]
pub struct Person {
  #[primary_key]
  conn: Identity,
  #[unique]
  id: u64,
  bodytile:u32,
  result: Option<ActionResult>,
}

const SIDE:usize = 1 << 7;

const WORLDSIZE:usize = SIDE * SIDE;

#[table(name=tile, public)]
pub struct Tile{
  #[primary_key]
  pos: u32,
  color: u32,
  #[unique]
  #[index(btree)]
  id: u32,
  owner: u64,
  last_action: Timestamp,
  energy: u32,
}

#[table(name=scheduled_action, scheduled(invoke_scheduled))]
pub struct ScheduledAction{
  #[primary_key]
  id: u64, // id of the Tile that requested it upcasted
  scheduled_at:ScheduleAt,
  action:GameAction,
  sender:Identity,
}


#[spacetimedb::reducer]
pub fn invoke_scheduled(ctx:&ReducerContext, args:ScheduledAction)-> Result<(),String>{
  handle_action(ctx, args.sender, args.action)?;
  Ok(())
}


#[derive(SpacetimeType)]
pub enum ActionType {
  Put(PutAction),
  Delete,
  Move,
}


#[derive(SpacetimeType)]
pub struct PutAction {
  id: u32,
  energy: u32,
  color:u32,
}

#[derive(SpacetimeType)]
pub struct GameAction{
  typ: ActionType,
  player:u32,
  pos: u32,
  id: u32,
}

#[derive(SpacetimeType)]
pub struct ActionResult {
  pub id: u32,
  pub result: ActionResultVariant,
}

#[derive(SpacetimeType)]
pub enum ActionResultVariant {
  Ok,
  Err { msg: String },
}

fn tocoord(pos:u32) -> (u32, u32){
  ((pos & (SIDE -1) as u32), (pos >> 7) )
} 

fn sqdist(pos:u32, other:u32)->u32{
  let (ax, ay) = tocoord(pos);
  let (bx, by) = tocoord(other);
  ax.abs_diff(bx).pow(2) + ay.abs_diff(by).pow(2)
}



#[reducer(client_connected)]
pub fn identity_connected(ctx: &ReducerContext) -> Result<(), String> {
  spawn(ctx)
}



#[spacetimedb::reducer]
pub fn spawn(ctx:&ReducerContext)->Result<(), String>{
  let randpos = ctx.random::<u32>();

  log::info!("delete {}", ctx.sender);
  ctx.db.person().conn().delete(ctx.sender);
  let mut player = Person{
    conn:ctx.sender,
    id: 0,
    bodytile:0,
    result: None,
  };

  player.id = ctx.random();

  let bod = Tile{
    pos:randpos % WORLDSIZE as u32,
    color:255<<24,
    id:randpos,
    owner:player.id,
    energy: 100,
    last_action: ctx.timestamp,
  };

  player.bodytile = bod.id;

  ctx.db.tile().insert(bod);
  ctx.db.person().insert(player);
  Ok(())

}

#[spacetimedb::reducer]
pub fn request_action(ctx:&ReducerContext, action:GameAction)->Result<(),String>{
  handle_action(ctx, ctx.sender, action)
}


pub fn handle_action(ctx:&ReducerContext, sender:Identity, action:GameAction)->Result<(), String>{

  let aid = action.id;
  let res = do_action(ctx,  sender, action);
  let mut person = ctx.db.person().conn().find(sender).ok_or(format!("player not found {}", sender))?;
  person.result = Some(ActionResult{
    id: aid,
    result: match res{
      Ok(DoResult::Done) =>ActionResultVariant::Ok,
      Ok(DoResult::Scheduled) => return Ok(()),
      Err(msg)=> ActionResultVariant::Err { msg },
    }
  });
  ctx.db.person().conn().update(person);
  Ok(())
}

enum DoResult {
  Done,
  Scheduled
}

fn do_action(ctx:&ReducerContext, sender:Identity, action:GameAction)->Result<DoResult, String>{
  let mut block = ctx.db.tile().id().find(action.player).ok_or("not found")?;

  let deltat = ctx.timestamp.duration_since(block.last_action).unwrap().as_millis();
  if deltat < 100 {
    ctx.db.scheduled_action().id().delete(action.player as u64);
    ctx.db.scheduled_action().insert(ScheduledAction{
      id: action.player as u64,
      scheduled_at: (ctx.timestamp + TimeDuration::from_micros(100*1000)).into(),
      action, sender,
    });
    return Ok(DoResult::Scheduled)
  }

  block.last_action = ctx.timestamp;

  let player = ctx.db.person().conn().find(sender).ok_or("player not found 2")?;
  let mut  body = ctx.db.tile().id().find(player.bodytile).ok_or("body not found")?;
  body.energy += ctx.timestamp.duration_since(body.last_action).unwrap().as_millis().div_euclid(100) as u32;



  if block.owner != player.id{ return Err("illegal action".to_string()) }

  ctx.db.tile().id().update(body);

  let cost = sqdist(block.pos, action.pos).div_euclid(2) as i32 + match action.typ{
    ActionType::Delete =>{
      if !ctx.db.tile().pos().delete(action.pos){
        return Err("no block at pos.".to_string())
      };
      -10
    },
    ActionType::Put(putaction) => {
      if ctx.db.tile().pos().find(action.pos).is_some(){
        return Err("no block at pos.".to_string())
      }
      ctx.db.tile().insert(
        Tile{
          pos: action.pos,
          owner: player.id,
          id: putaction.id,
          energy: putaction.energy,
          color: putaction.color,
          last_action: ctx.timestamp,
        });
      10 + putaction.energy as i32
    },
    ActionType::Move => {

      if ctx.db.tile().pos().find(action.pos).is_some(){
        return Err("position blocked".to_string())
      }
      block.pos = action.pos;
      1
    },
  };
  if cost > block.energy as i32 {
    return Err("not enough energy!".to_string())
  }
  block.energy = (block.energy as i32 - cost) as u32;
  ctx.db.tile().id().update(block);
  Ok(DoResult::Done)

}





// #[spacetimedb::reducer]
// pub fn add(ctx: &ReducerContext, name: String) {
//     ctx.db.person().insert(Person { name });
// }

// #[spacetimedb::reducer]
// pub fn say_hello(ctx: &ReducerContext) {
//     for person in ctx.db.person().iter() {
//         log::info!("Hello, {}!", person.name);
//     }
//     log::info!("Hello, World!");
// }
