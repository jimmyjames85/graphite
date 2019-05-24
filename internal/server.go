package internal

type Record interface {
	Name() string
	ID() int
	AssignID(p int) error
}

type Registry map[string]int

type Server struct {
	selector   string
	port       int
	registries map[string]Registry
}

func NewServer(port int) *Server {
	ret := Server{
		port:       port,
		registries: make(map[string]Registry),
	}

	return &ret
}

func (s *Server) Serve() error {

	return nil
}
