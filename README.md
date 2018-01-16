# lapper

Lapper is a tool for recording splits for athletes.
Use lapper to plan meets and workouts, record splits for all your athletes,
and keep track of progress over the course of the season.

Built with [preact](https://preactjs.com/) and [Spring Data REST](https://projects.spring.io/spring-data-rest/)

## TODO

- [x] athlete avatar (random + upload picture)
- [x] lux filter working
- [x] athlete page includes avatar, performances
- [x] athlete picker
- [x] stopwatch on each athlete working, display total time when event ended
- [x] lock in simple menu bar
- [x] login doesn't exist -- tmp cleanup
- [x] hide bib number
- [x] hide place column
- [x] links moved outside of active athlete click

### Minimum Alpha Launch

- [ ] don't save untouched Store (or add confirm to deleting touched store)
- [ ] split spans working, table span the header and put each split in it's own column
- [ ] add filters to lists (including search)
- [ ] organize code directories
- [ ] place column actually displaying place
- [ ] event performances sort on column header click
- [ ] ability to manually set splits (with split 'source' field for noting that it's manual)
- [ ] optimize for mobile (column toggler, vertical ellipsis instead of all elts)

### Minimum Beta Launch
---

- [ ] lux state separated out of state
- [ ] cache tracker component
- [ ] implement server
- [ ] LuxRestStore

### Lux Launch
---

- [ ] login working. user event/athlete ownership
- [ ] user can map to athlete
- [ ] visitors can watch events in real time
- [ ] implement meets (a collection of events. type: meet, workout, race series)

### MVP above
---

- [ ] LuxWebsocketStore
