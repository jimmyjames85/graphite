# graphite

```
	go run cmd/emit/main.go $VAL1 &
	go run cmd/emit/main.go $VAL2 &
	go run cmd/emit/main.go $VAL3 &
```


 - Gauges overwrite eachother
 - Timers overwrite eachother

 - Counters accumulate
