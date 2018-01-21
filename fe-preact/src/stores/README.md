# LuxStore

In store you must define:
- initial state based on props
- keys
- any special functions you need to handle complex actions (otherwise just use setState);
- any special actions you want to handle in delete (cascading, etc.)

If there's any component state that doesn't need to be persisted as part of store, you can use component.setState() as with regular react.

## TODO

- [ ] separate lux state from regular state
- [ ] handle key rehoming
- [ ] move init state out of constructor
- [ ] only call setState on keys in store.state (so that persisted objects don't get bloated), but pass along those other keys to the components
