function Juego() {
  this.partidas = {};
  this.usuarios = {};

  this.agregarUsuario = function (nick) {
    if (this.usuarios[nick]) {
      console.log(`El usuario ${nick} ya existe`);
      return null;
    }
    this.usuarios[nick] = new Usuario(nick, this);
    console.log(`Nuevo usuario en el sistema: ${nick}`);
    return this.usuarios[nick];
  };
  this.eliminarUsuario = function (nick) {
    this.finalizarJuegosDe(nick);

    let existiaUsuario = this.usuarios[nick] != null;
    let eliminacionExitosa = delete this.usuarios[nick];
    let haSidoEliminado = eliminacionExitosa && existiaUsuario;
    console.log(
      haSidoEliminado
        ? `Eliminado al usuario ${nick}`
        : `no se pudo eliminar a ${nick}`
    );
    return haSidoEliminado;
  };

  this.finalizarJuegosDe = function (nick) {
    for (let codigoPartida in this.partidas) {
      let partida = this.partidas[codigoPartida];
      if (partida.esOwnerDe(nick)) {
        partida.fase = "final";
        console.log(
          `La partida ${partida.codigo} pasa a finalizada porque el propietario ${nick} dejó el juego`
        );
      } else if (partida.esJugadoPor(nick)) {
        if (partida.fase == "inicial") {
          partida.eliminarJugador(nick);
          console.log(
            `El jugador "${nick}" abandona la partida ${partida.codigo}`
          );
        }
      }
    }
  };

  this.crearPartidaUsuario = function (usuario) {
    //Obtener uid
    //Crear partida
    //Asignar propietario a nick
    //Devolver partida
    let codigo = Date.now();
    this.partidas[codigo] = new Partida(codigo, usuario);
    return codigo;
  };

  this.crearPartidaNick = function (nick) {
    let usuario = this.usuarios[nick];
    if (!usuario) {
      return -1;
    }

    let codigoPartida = usuario.crearPartida();
    return codigoPartida;
  };

  this.obtenerPartida = function (codigo) {
    return this.partidas[codigo];
  };

  this.unirAPartida = function (codigo, usuario) {
    const partida = this.partidas[codigo];
    if (!partida) {
      console.log("La partida no existe");
      return false;
    }
    return partida.agregarJugador(usuario);
  };

  this.unirAPartidaNick = function (codigo, nick) {
    let usuario = this.usuarios[nick];
    if (!usuario) {
      return false;
    }

    let codigoPartida = usuario.unirseAPartida(codigo);
    return codigoPartida;
  };

  this.obtenerPartidas = function () {
    let lista = [];
    for (let key in this.partidas) {
      lista.push({
        codigo: key,
        owner: this.partidas[key].owner.nick,
        fase: this.partidas[key].fase,
      });
    }
    return lista;
  };

  this.obtenerPartidasDisponibles = function () {
    let filterLista = [];
    let lista = this.obtenerPartidas();
    for (let i = 0; i < lista.length; i++) {
      let partidaJson = lista[i];
      let partida = this.partidas[partidaJson.codigo];
      if (partida.estaDisponible()) {
        filterLista.push(partidaJson);
      }
    }
    return filterLista;
  };
}

function Usuario(nick, juego) {
  this.nick = nick;
  this.juego = juego;

  this.crearPartida = function () {
    return this.juego.crearPartidaUsuario(this);
  };

  this.unirseAPartida = function (codigo) {
    return this.juego.unirAPartida(codigo, this);
  };
}

function Jugador(usuario) {
  this.usuario = usuario;
  this.tablero;
  this.barcos;

  this.nick = () => usuario.nick;
}

function Partida(codigo, usuario) {
  this.codigo;
  this.fase = "inicial";
  this.owner = usuario;

  this.crearJugador = (usuario) => {
    let jugador = new Jugador(usuario);
    // Actualizar luego para tener todos los barcos
    let barcos = [new Barco(1), new Barco(3), new Barco(3)];
    let tablero = new Tablero();
    //Cambiar tamaño si hace falta
    tablero.crearTablero(8);

    jugador.barcos = barcos;
    jugador.tablero = tablero;

    return jugador;
  };

  this.jugadores = [this.crearJugador(usuario)];
  const maxJugadores = 2;

  this.agregarJugador = function (usuario) {
    if (!this.hayHueco()) {
      console.log("Partida llena");
      return false;
    }
    jugador = this.crearJugador(usuario);

    this.jugadores.push(jugador);
    console.log(
      `El usuario ${usuario.nick} se ha unido a la partida ${codigo}`
    );

    this.comprobarFase();
    return true;
  };

  this.eliminarJugador = function (nick) {
    let idx = this.jugadores.findIndex((p) => p.nick() == nick);
    if (idx != -1) {
      this.jugadores.splice(idx, 1);
    }
  };

  this.estaDisponible = function () {
    return this.jugadores.length < maxJugadores;
  };

  this.comprobarFase = function () {
    if (!this.hayHueco()) {
      this.fase = "jugando";
    }
  };

  this.esJugando = function () {
    return this.fase == "jugando";
  };

  this.esOwnerDe = function (nick) {
    return this.owner.nick == nick;
  };

  this.esJugadoPor = function (nick) {
    return this.jugadores.some((j) => j.nick == nick);
  };

  this.hayHueco = () => this.jugadores.length < maxJugadores;
}

function Barco(tamano) {
  this.tamano = tamano;
  this.vida = tamano;
  this.golpear = () => {};
}

function CeldaBarco(barco) {
  this.barco = barco;

  this.golpear = () => {
    this.barco.vida -= 1;
    let vidaTexto =
      this.barco.vida == 0
        ? "Barco hundido"
        : ` le queda ${this.barco.vida} celdas antes de que se hunda`;
    return `Barco de tamaño ${this.barco.tamano} golpeado, ${vidaTexto}`;
  };

  this.estadoGolpeado = () => {
    return "Barco ya golpeado";
  };
}

function Agua() {
  this.golpear = () => {
    return "Agua";
  };

  this.estadoGolpeado = () => {
    return "Agua ya golpeada";
  };
}

function Celda(x, y) {
  this.x = x;
  this.y = y;

  this.contiene = new Agua();
  this.golpeado = false;

  this.golpear = () => {
    if (this.golpeado) return this.contiene.estadoGolpeado();

    this.golpeado = true;
    return this.contiene.golpear();
  };
}

function Tablero() {
  this.celdas;

  this.crearTablero = function (tam) {
    this.celdas = new Array(tam);
    for (x = 0; x < tam; x++) {
      this.celdas[x] = new Array(tam);
      for (y = 0; y < tam; y++) {
        this.celdas[x][y] = new Celda(x, y);
      }
    }
  };
}
