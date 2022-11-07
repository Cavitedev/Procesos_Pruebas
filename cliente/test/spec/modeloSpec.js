describe("El juego", function () {
  var juego;
  var usr1, usr2, usr3;

  beforeEach(function () {
    juego = new Juego();
    usr1 = juego.agregarUsuario("pepe");
    usr2 = juego.agregarUsuario("luis");
    usr3 = juego.agregarUsuario("pepa");
  });

  describe("inicialmente", function () {
    it("No hay partidas", function () {
      console.log(juego);
      expect(juego.obtenerPartidas().length).toEqual(0);
    });
  });

  it("Crear juego y se une uno, el juego tiene 2 jugadores", function () {
    const partidaId = usr1.crearPartida();
    usr2.unirseAPartida(partidaId);

    const partida = juego.partidas[partidaId];

    expect(partida.owner.nick).toEqual(usr1.nick);
    expect(partida.jugadores.map((jugador) => jugador.nick())).toEqual([
      usr1.nick,
      usr2.nick,
    ]);
  });

  it("Crear juego y se unen otros dos, devuelve false al unirse el último y no se une", function () {
    const partidaId = usr1.crearPartida();
    const resultadoUnirseUsr2 = usr2.unirseAPartida(partidaId);
    const resultadoUnirseUsr3 = usr3.unirseAPartida(partidaId);

    const partida = juego.partidas[partidaId];
    expect(partida).toBeDefined();

    expect(resultadoUnirseUsr2).toEqual(true);
    expect(resultadoUnirseUsr3).toEqual(false);
    expect(partida.owner.nick).toEqual(usr1.nick);
    expect(partida.jugadores.map((jugador) => jugador.nick())).toEqual([
      usr1.nick,
      usr2.nick,
    ]);
  });

  it("Usuario intenta unirse a una partida no existente, devuelve false", function () {
    const idPartidaInexistente = 1;
    const resultadoUnirseUsr1 = usr1.unirseAPartida(idPartidaInexistente);
    expect(resultadoUnirseUsr1).toEqual(false);
  });

  it("Partida deja de estar disponible al llenarse", function () {
    const partidaId = usr1.crearPartida();
    let partida = juego.partidas[partidaId];

    expect(partida.estaDisponible()).toEqual(true);

    usr2.unirseAPartida(partidaId);

    expect(partida.estaDisponible()).toEqual(false);
  });

  it("Tras crear la partida hay 2 tableros con solo agua", () => {
    const partidaId = usr1.crearPartida();
    usr2.unirseAPartida(partidaId);

    const partida = juego.partidas[partidaId];
    const jugadores = partida.jugadores;

    for (jugador of jugadores) {
      let tablero = jugador.tablero;
      comprobarTableroAgua(tablero);
    }
  });

  it("Jugador 1 intenta añadir barco antes de entrar a la fase de despliegue, no se actualiza el tablero", () => {
    const partidaId = usr1.crearPartida();

    const partida = juego.partidas[partidaId];
    const jugadores = partida.jugadores;
    const jugador1 = jugadores[0];
    const tablero1 = jugador1.tablero;

    const seHaColocado = jugador1.colocarBarco(1, 4, 4);

    expect(seHaColocado).toEqual(false);
    expect(tablero1.celdas[4][4].estado()).toEqual("Agua");
  });

  it("Tras crear la partida con 2 jugadores, colocar un barco que no existe, no añade el barco", () => {
    const partidaId = usr1.crearPartida();
    usr2.unirseAPartida(partidaId);

    const partida = juego.partidas[partidaId];
    const jugadores = partida.jugadores;
    const jugador1 = jugadores[0];

    const seHaColocado = jugador1.colocarBarco(-1, 4, 4);

    expect(seHaColocado).toEqual(false);
    comprobarTableroAgua(jugador1.tablero);
  });

  it("Tras crear la partida con 2 jugadores, el primero coloca un barco con una orientación inválida", () => {
    const partidaId = usr1.crearPartida();
    usr2.unirseAPartida(partidaId);

    const partida = juego.partidas[partidaId];
    const jugadores = partida.jugadores;
    const jugador1 = jugadores[0];

    const seHaColocado = jugador1.colocarBarco(1, 4, 4, "xxx");

    expect(seHaColocado).toEqual(false);
    comprobarTableroAgua(jugador1.tablero);
  });

  it("Tras crear la partida con 2 jugadores, el primero coloca un barco fuera de los límites del tablero", () => {
    const partidaId = usr1.crearPartida();
    usr2.unirseAPartida(partidaId);

    const partida = juego.partidas[partidaId];
    const jugadores = partida.jugadores;
    const jugador1 = jugadores[0];

    const seHaColocado = jugador1.colocarBarco(2, 7, 7);

    expect(seHaColocado).toEqual(false);
    comprobarTableroAgua(jugador1.tablero);
  });

  it("Tras crear la partida con 2 jugadores, el primer jugador coloca el primer barco dos veces, la posición del barco cambia", () => {
    const partidaId = usr1.crearPartida();
    usr2.unirseAPartida(partidaId);

    const partida = juego.partidas[partidaId];
    const jugadores = partida.jugadores;
    const jugador1 = jugadores[0];
    const tablero1 = jugador1.tablero;

    const seHaColocado = jugador1.colocarBarco(0, 4, 4);

    expect(seHaColocado).toEqual(true);
    expect(tablero1.celdas[4][4].estado()).toEqual("Barco");

    const seHaColocado2 = jugador1.colocarBarco(0, 3, 3);

    expect(seHaColocado2).toEqual(true);
    expect(tablero1.celdas[4][4].estado()).toEqual("Agua");
    expect(tablero1.celdas[3][3].estado()).toEqual("Barco");
  });

  it("Tras que se unan los dos jugadores, ambos ponen sus barcos en sus tableros, el jugador 1 coloca un barco en vertical y se debe pasar a la fase jugando una vez acabe", () => {
    const partidaId = usr1.crearPartida();
    usr2.unirseAPartida(partidaId);

    const partida = juego.partidas[partidaId];
    const jugadores = partida.jugadores;
    const jugador1 = jugadores[0];
    const tablero1 = jugador1.tablero;

    const seHaColocado1_1 = jugador1.colocarBarco(0, 4, 4);
    const seHaColocado1_2 = jugador1.colocarBarco(1, 3, 3);
    const seHaColocado1_3 = jugador1.colocarBarco(2, 5, 2, "vertical");
    jugador1.confirmarTablero();

    expect(seHaColocado1_1).toEqual(true);
    expect(seHaColocado1_2).toEqual(true);
    expect(seHaColocado1_3).toEqual(true);

    expect(tablero1.celdas[3][3].estado()).toEqual("Barco");
    expect(tablero1.celdas[4][4].estado()).toEqual("Barco");
    expect(tablero1.celdas[5][2].estado()).toEqual("Barco");
    expect(tablero1.celdas[5][3].estado()).toEqual("Barco");
    expect(jugador1.flota[2].orientacion).toEqual("vertical");

    const jugador2 = jugadores[1];
    const tablero2 = jugador2.tablero;

    const seHaColocado2_1 = jugador2.colocarBarco(0, 1, 1);
    const seHaColocado2_2 = jugador2.colocarBarco(1, 6, 4);
    const seHaColocado2_3 = jugador2.colocarBarco(2, 2, 3, "horizontal");
    jugador2.confirmarTablero();

    expect(seHaColocado2_1).toEqual(true);
    expect(seHaColocado2_2).toEqual(true);
    expect(seHaColocado2_3).toEqual(true);

    expect(tablero2.celdas[1][1].estado()).toEqual("Barco");
    expect(tablero2.celdas[6][4].estado()).toEqual("Barco");
    expect(tablero2.celdas[2][3].estado()).toEqual("Barco");
    expect(tablero2.celdas[3][3].estado()).toEqual("Barco");
    expect(jugador2.flota[2].orientacion).toEqual("horizontal");

    expect(partida.fase).toEqual("jugando");
  });
  describe("tras crear partida", () => {
    let partida;
    let jugador1, jugador2;
    beforeEach(() => {
      const partidaId = usr1.crearPartida();
      usr2.unirseAPartida(partidaId);

      partida = juego.partidas[partidaId];
      const jugadores = partida.jugadores;
      jugador1 = jugadores[0];

      jugador1.colocarBarco(0, 4, 4);
      jugador1.colocarBarco(1, 3, 3);
      jugador1.colocarBarco(2, 5, 2, "vertical");
      jugador1.confirmarTablero();

      jugador2 = jugadores[1];
      jugador2.colocarBarco(0, 1, 1);
      jugador2.colocarBarco(1, 6, 4);
      jugador2.colocarBarco(2, 2, 3, "horizontal");
      jugador2.confirmarTablero();
    });

    it("Dispara cuando no toca turno no cambia nada", () => {
      let haDisparado = jugador2.disparar(3, 3);
      expect(haDisparado).toEqual(false);
      expect(partida.turno).toEqual(0);
    });
  });
});

function comprobarTableroAgua(tablero) {
  for (let i = 0; i < tablero.length; i++) {
    const fila = tablero[i];
    for (let j = 0; j < fila.length; j++) {
      const celda = fila[j];
      expect(celda.x).toEqual(i);
      expect(celda.y).toEqual(j);
      expect(celda.golpeado).toEqual(false);
      expect(celda.contiene).toBeInstanceOf(Agua);
    }
  }
}
