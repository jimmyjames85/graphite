FROM grafana/grafana:latest

ADD sysdig /var/lib/grafana/plugins/sysdig
