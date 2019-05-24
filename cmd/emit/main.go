package main

import (
	"fmt"
	"net"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	graphite "github.com/cyberdelia/go-metrics-graphite"
	metrics "github.com/rcrowley/go-metrics"
)

func main() {

	if len(os.Args) < 2 {
		fmt.Printf("please provide a value\n")
		os.Exit(-1)
	}

	myValue, err := strconv.Atoi(os.Args[1])
	if err != nil {
		fmt.Printf("please provide value as integer \n")
		os.Exit(-1)
	}

	hostname := "foo"
	if len(os.Args) > 2 {
		hostname = os.Args[2]
	}

	registry := metrics.NewRegistry()
	addr, err := net.ResolveTCPAddr("tcp", "127.0.0.1:2003")
	if err != nil {
		panic(err)
	}
	go graphite.Graphite(registry, time.Second, fmt.Sprintf("some.prefix.%s", hostname), addr)

	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGTERM, os.Interrupt)
		for x := range c {
			fmt.Printf("got signal: %d\n", x)
			os.Exit(-1)
		}
	}()

	for {
		metrics.GetOrRegisterCounter("counter", registry).Inc(2)
		metrics.GetOrRegisterGauge("gauge", registry).Update(int64(myValue))
		metrics.GetOrRegisterTimer("timer", registry).Update(time.Duration(myValue) * time.Second)
		time.Sleep(2 * time.Second)
	}

}
