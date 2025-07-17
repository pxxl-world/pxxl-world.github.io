
use std::fmt::{self, Debug};

use spacetimedb::{Identity, ReducerContext, SpacetimeType, Table, Timestamp};


#[derive(Debug)]
#[spacetimedb::table(name = person, public)]
pub struct Person {
  #[primary_key]
  conn: Identity,
  #[unique]
  id: u64,
  bodytile:u32,
}

const SIDE:usize = 1 << 7;

const WORLDSIZE:usize = SIDE * SIDE;

#[spacetimedb::table(name=tile, public)]
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


#[spacetimedb::reducer(init)]
pub fn init(_ctx: &ReducerContext) {
  // Called when the module is initially published
}

#[spacetimedb::reducer(client_connected)]
pub fn identity_connected(_ctx: &ReducerContext) {
  // Called everytime a new client connects
}

#[spacetimedb::reducer(client_disconnected)]
pub fn identity_disconnected(_ctx: &ReducerContext) {
  // Called everytime a client disconnects
}

pub enum ActionError{
    IDClash
}

impl Debug for ActionError{
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self{
        ActionError::IDClash => f.write_str("IDClash")
    }
  }
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
}

fn tocoord(pos:u32) -> (u32, u32){
  ((pos & (SIDE -1) as u32), (pos >> 7) )
} 

fn sqdist(pos:u32, other:u32)->u32{
  let (ax, ay) = tocoord(pos);
  let (bx, by) = tocoord(other);
  ax.abs_diff(bx).pow(2) + ay.abs_diff(by).pow(2)
}


#[spacetimedb::reducer]
pub fn spawn(ctx:&ReducerContext)->Result<(), String>{
  let randpos = ctx.random::<u32>();
  ctx.db.person().conn().delete(ctx.sender);
  let mut player = Person{
    conn:ctx.sender,
    id: 0,
    bodytile:0,
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
pub fn action(ctx:&ReducerContext, action:GameAction)->Result<(), String>{
  let mut block = ctx.db.tile().id().find(action.player).ok_or("not found")?;

  let deltat = ctx.timestamp.duration_since(block.last_action).unwrap().as_millis();
  if deltat < 100 {return Err("only 10 actions per second allowed.".to_string())}

  let player = ctx.db.person().conn().find(ctx.sender).ok_or("player not found")?;
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
      block.pos = action.pos;
      1
    },
  };
  if cost > block.energy as i32 {
    return Err("not enough energy!".to_string())
  }
  block.energy = (block.energy as i32 - cost) as u32;
  ctx.db.tile().id().update(block);
  Ok(())

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
