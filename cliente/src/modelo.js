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

function Jugador(usuario, partida) {
  this.usuario = usuario;
  this.partida = partida;
  this.tablero;
  this.flota;
  this.despliegueListo = false;

  this.nick = () => usuario.nick;
  this.colocarBarco = (indiceBarco, x, y, orientacion = "horizontal") => {
    this.despliegueListo = false;
    if (this.partida.fase != "desplegando") return false;
    if (indiceBarco < 0 || indiceBarco >= this.flota.length) return false;
    let barco = this.flota[indiceBarco];

    let haSidoColocado = this.tablero.colocarBarco(barco, x, y, orientacion);
    if (haSidoColocado) {
      barco.desplegado = true;
      barco.orientacion = orientacion;
    }
    this.partida.comprobarFase();
    return haSidoColocado;
  };

  this.confirmarTablero = () => {
    if (this.estaDesplegado) {
      this.despliegueListo = true;
      this.partida.comprobarFase();
    }
  };

  this.estaDesplegado = () => {
    for (const barco of this.flota) {
      if (!barco.desplegado) {
        return false;
      }
    }
    return true;
  };

  this.disparar = (x, y) => {
    return this.partida.disparar(this.nick(), x, y);
  };
}

function Partida(codigo, usuario) {
  this.codigo;
  this.fase = "inicial";
  this.owner = usuario;
  this.turno = 0;

  this.crearJugador = (usuario) => {
    let jugador = new Jugador(usuario, this);
    // Actualizar luego para tener todos los flota
    let flota = [new Barco(1), new Barco(1), new Barco(2)];
    let tablero = new Tablero();
    //Cambiar tamaño si hace falta
    tablero.crearTablero(8);

    jugador.flota = flota;
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

  this.obtenerJugador = function (nick) {
    let idx = this.jugadores.findIndex((p) => p.nick() == nick);
    if (idx != -1) {
      return this.jugadores[idx];
    }
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
    if (this.estaDesplegado()) {
      this.fase = "jugando";
    } else if (!this.hayHueco()) {
      this.fase = "desplegando";
    }
  };

  this.hayHueco = () => this.jugadores.length < maxJugadores;

  this.estaDesplegado = () => {
    return this.jugadores.every((jugador) => jugador.despliegueListo);
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

  this.otroTurno = () => (this.turno + 1) % this.jugadores.length;

  this.cambiarTurno = () => {
    this.turno = this.otroTurno();
  };

  this.jugadorTurnoActual = () => this.jugadores[this.turno];
  this.jugadorSinTurnoActual = () => this.jugadores[this.otroTurno()];

  this.disparar = (nick, x, y) => {
    const jugadorTurno = this.jugadorTurnoActual();

    if (jugadorTurno.nick() != nick) {
      console.log("No es el turno de", nick);
      return false;
    }

    const jugadorRecibeAtaque = jugadorTurnoActual;
    const tableroAtacado = jugadorRecibeAtaque.tablero;

    tableroAtacado.recibirDisparo(x, y);
    this.comprobarFase();
  };
}

function Barco(tamano) {
  this.tamano = tamano;
  this.vida = tamano;
  this.desplegado = false;
  this.recibirDisparo = () => {};
}

function CeldaBarco(barco) {
  this.barco = barco;
  this.golpeado = false;
  this.estado = "intacto";

  this.recibirDisparo = () => {
    if (this.golpeado) return "Este barco ya fue golpeado";
    this.barco.vida -= 1;
    this.golpeado = true;
    let vidaTexto =
      this.barco.vida == 0
        ? "Barco hundido"
        : ` le queda ${this.barco.vida} celdas antes de que se hunda`;
    return `Barco de tamaño ${this.barco.tamano} golpeado, ${vidaTexto}`;
  };

  this.estadoNoGolpeado = () => {
    return "Barco";
  };

  this.estadoGolpeado = () => {
    return "Barco ya golpeado";
  };

  this.sePuedeSobrescribir = () => false;

  this.contieneAlBarco = (barco) => barco === this.barco;
}

function Agua() {
  this.recibirDisparo = () => {
    return "Agua";
  };

  this.estadoNoGolpeado = () => {
    return "Agua";
  };

  this.estadoGolpeado = () => {
    return "Agua";
  };

  this.sePuedeSobrescribir = () => true;

  this.contieneAlBarco = (barco) => false;
}

function Celda(x, y) {
  this.x = x;
  this.y = y;

  this.contiene = new Agua();

  this.recibirDisparo = () => {
    return this.contiene.recibirDisparo();
  };

  this.estado = () => {
    if (this.golpeado) return this.contiene.estadoGolpeado();
    return this.contiene.estadoNoGolpeado();
  };

  this.sePuedeSobrescribir = () => {
    return this.contiene.sePuedeSobrescribir();
  };

  this.contieneAlBarco = (barco) => {
    return this.contiene.contieneAlBarco(barco);
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

  this.obtenerCelda = (x, y) => {
    if (
      x < 0 ||
      y < 0 ||
      x >= this.celdas[0].length ||
      y >= this.celdas.length
    ) {
      return false;
    }

    return this.celdas[x][y];
  };

  this.recibirDisparo = (x, y) => {
    let celda = this.obtenerCelda(x, y);
    celda.recibirDisparo();
  };

  this.colocarBarco = (barco, x, y, orientacion = "horizontal") => {
    orientacion = orientacion.toLowerCase();
    if (orientacion != "horizontal" && orientacion != "vertical") return false;

    const sePuedeColocar = this.sePuedeColocarBarco(barco, x, y, orientacion);
    if (!sePuedeColocar) {
      return false;
    }

    this.limpiarBarcoDelTablero(barco);

    let seHaColocado = this.colocarBarcoForzado(barco, x, y, orientacion);
    return seHaColocado;
  };

  this.sePuedeColocarBarco = (barco, x, y, orientacion = "horizontal") => {
    for (let offset = 0; offset < barco.tamano; offset++) {
      let celda;
      if (orientacion === "horizontal") {
        celda = this.obtenerCelda(x + offset, y);
      } else {
        celda = this.obtenerCelda(x, y + offset);
      }

      if (!celda || !celda.sePuedeSobrescribir()) {
        return false;
      }
    }
    return true;
  };

  this.limpiarBarcoDelTablero = (barco) => {
    for (let i = 0; i < this.celdas.length; i++) {
      const fila = this.celdas[i];
      for (let j = 0; j < fila.length; j++) {
        const celda = fila[j];
        if (celda.contieneAlBarco(barco)) {
          celda.contiene = new Agua();
        }
      }
    }
  };

  this.colocarBarcoForzado = (barco, x, y, orientacion = "horizontal") => {
    for (let offset = 0; offset < barco.tamano; offset++) {
      let celda;
      if (orientacion === "horizontal") {
        celda = this.obtenerCelda(x + offset, y);
      } else {
        celda = this.obtenerCelda(x, y + offset);
      }

      celda.contiene = new CeldaBarco(barco);
    }
    return true;
  };
}
