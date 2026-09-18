/* =====================================================
   script.js
   Juego "Adivina el Pokémon".
   Consume la PokéAPI, una API RESTful gratuita.

   Documentación: https://pokeapi.co/docs/v2
   No requiere clave ni registro.
   ===================================================== */


/* -----------------------------------------------------
   1. CONFIGURACIÓN
   ----------------------------------------------------- */

// Dirección base del servicio REST
const API_URL = "https://pokeapi.co/api/v2/pokemon/";

// Se usan los 151 Pokémon de la primera generación
// porque son los más conocidos.
const TOTAL_POKEMON = 151;

// Aquí se guarda el Pokémon de la ronda actual
let pokemonActual = null;

// Marcador
let aciertos = 0;
let rondas = 0;

// Indica si la ronda ya terminó (acertó o se rindió)
let rondaTerminada = false;


/* -----------------------------------------------------
   2. ELEMENTOS DEL HTML
   document.getElementById busca un elemento por su id
   ----------------------------------------------------- */

const estadoJuego = document.getElementById("estadoJuego");
const imagenPokemon = document.getElementById("imagenPokemon");
const inputRespuesta = document.getElementById("respuesta");

const btnAdivinar = document.getElementById("btnAdivinar");
const btnPista = document.getElementById("btnPista");
const btnRendirse = document.getElementById("btnRendirse");
const btnNuevo = document.getElementById("btnNuevo");

const textoPista = document.getElementById("textoPista");
const marcadorAciertos = document.getElementById("marcadorAciertos");
const marcadorRondas = document.getElementById("marcadorRondas");
const fichaPokemon = document.getElementById("fichaPokemon");

const btnPruebas = document.getElementById("btnPruebas");
const resultadosPruebas = document.getElementById("resultadosPruebas");


/* -----------------------------------------------------
   3. PEDIR UN POKÉMON A LA API
   async/await sirve para esperar la respuesta de
   internet sin congelar la página.
   ----------------------------------------------------- */

async function obtenerPokemon(numero) {

    // Se arma la dirección completa
    // Ejemplo: https://pokeapi.co/api/v2/pokemon/25
    const url = API_URL + numero;

    // fetch() hace la petición GET al servidor
    const respuesta = await fetch(url);

    // Si el servidor contesta con error (404, 500...), lo avisamos
    if (!respuesta.ok) {
        throw new Error("La API respondió con el código " + respuesta.status);
    }

    // .json() convierte la respuesta en un objeto de JavaScript
    const datos = await respuesta.json();

    // De toda la respuesta (que es enorme) solo nos quedamos
    // con lo que el juego necesita.
    return {
        numero: datos.id,
        nombre: datos.name,
        imagen: datos.sprites.other["official-artwork"].front_default,
        tipos: datos.types.map(function (t) { return t.type.name; }),
        altura: datos.height / 10,   // la API la da en decímetros
        peso: datos.weight / 10      // la API lo da en hectogramos
    };
}


/* -----------------------------------------------------
   4. EMPEZAR UNA RONDA NUEVA
   ----------------------------------------------------- */

async function nuevaRonda() {

    // Mensaje mientras llega la respuesta
    estadoJuego.className = "alert alert-secondary";
    estadoJuego.textContent = "Cargando Pokémon...";

    // Se limpia todo lo de la ronda anterior
    textoPista.textContent = "";
    inputRespuesta.value = "";
    fichaPokemon.innerHTML = "";
    rondaTerminada = false;

    // Math.random() da un decimal entre 0 y 1.
    // Math.floor() lo redondea hacia abajo.
    // Así sale un número entero del 1 al 151.
    const numero = Math.floor(Math.random() * TOTAL_POKEMON) + 1;

    // try / catch: si falla la red o la API, se avisa
    // en lugar de dejar la sección en blanco.
    try {
        pokemonActual = await obtenerPokemon(numero);

        // Se muestra la imagen en negro (silueta)
        imagenPokemon.src = pokemonActual.imagen;
        imagenPokemon.classList.add("silueta");

        estadoJuego.className = "alert alert-info";
        estadoJuego.textContent = "¿Quién es ese Pokémon? Escribe su nombre.";

    } catch (error) {
        pokemonActual = null;
        imagenPokemon.src = "";
        estadoJuego.className = "alert alert-danger";
        estadoJuego.textContent =
            "No se pudo cargar el Pokémon. Revisa tu conexión a internet. (" +
            error.message + ")";
    }
}


/* -----------------------------------------------------
   5. COMPARAR LA RESPUESTA
   Se limpia el texto antes de comparar para que
   "PIKACHU", "pikachu " y "Pikachú" cuenten igual.
   ----------------------------------------------------- */

function limpiarTexto(texto) {
    return texto
        .trim()                 // quita espacios de los lados
        .toLowerCase()          // todo a minúsculas
        .normalize("NFD")       // separa las letras de sus acentos
        .replace(/[\u0300-\u036f]/g, "")    // borra los acentos
        .replace(/[\s-]/g, "");             // borra espacios y guiones
        // Lo último sirve para nombres como "mr-mime":
        // así "Mr Mime", "mr-mime" y "mrmime" cuentan igual.
}

function adivinar() {

    // Si no hay Pokémon cargado o la ronda ya acabó, no se hace nada
    if (pokemonActual === null || rondaTerminada === true) {
        return;
    }

    const respuesta = limpiarTexto(inputRespuesta.value);

    // Si el campo está vacío
    if (respuesta === "") {
        estadoJuego.className = "alert alert-warning";
        estadoJuego.textContent = "Escribe un nombre antes de adivinar.";
        return;
    }

    rondas = rondas + 1;

    if (respuesta === limpiarTexto(pokemonActual.nombre)) {
        aciertos = aciertos + 1;
        estadoJuego.className = "alert alert-success";
        estadoJuego.textContent = "¡Correcto! Es " + pokemonActual.nombre + ".";
        revelar();
    } else {
        estadoJuego.className = "alert alert-danger";
        estadoJuego.textContent =
            "No era " + inputRespuesta.value + ". Era " + pokemonActual.nombre + ".";
        revelar();
    }

    actualizarMarcador();
}


/* -----------------------------------------------------
   6. REVELAR EL POKÉMON Y MOSTRAR SU FICHA
   ----------------------------------------------------- */

function revelar() {

    rondaTerminada = true;

    // Al quitar la clase, la imagen deja de estar en negro
    imagenPokemon.classList.remove("silueta");

    // Se arma la ficha con los datos que devolvió la API
    const datos = [
        ["Nombre", pokemonActual.nombre],
        ["Número en la Pokédex", pokemonActual.numero],
        ["Tipo", pokemonActual.tipos.join(", ")],
        ["Altura", pokemonActual.altura + " m"],
        ["Peso", pokemonActual.peso + " kg"]
    ];

    fichaPokemon.innerHTML = "";

    for (const [dato, valor] of datos) {
        const fila = document.createElement("tr");
        fila.innerHTML = "<td>" + dato + "</td><td>" + valor + "</td>";
        fichaPokemon.appendChild(fila);
    }
}


/* -----------------------------------------------------
   7. PISTA, RENDIRSE Y MARCADOR
   ----------------------------------------------------- */

function mostrarPista() {

    if (pokemonActual === null) {
        return;
    }

    // charAt(0) saca la primera letra del nombre
    // toUpperCase() la pone en mayúscula
    textoPista.textContent =
        "Pista: es de tipo " + pokemonActual.tipos.join(" y ") +
        ", empieza con \"" + pokemonActual.nombre.charAt(0).toUpperCase() +
        "\" y tiene " + pokemonActual.nombre.length + " letras.";
}

function rendirse() {

    if (pokemonActual === null || rondaTerminada === true) {
        return;
    }

    rondas = rondas + 1;

    estadoJuego.className = "alert alert-warning";
    estadoJuego.textContent = "Era " + pokemonActual.nombre + ".";

    revelar();
    actualizarMarcador();
}

function actualizarMarcador() {
    marcadorAciertos.textContent = aciertos;
    marcadorRondas.textContent = rondas;
}


/* -----------------------------------------------------
   8. PRUEBAS DE FUNCIONAMIENTO
   Cada prueba comprueba una condición y muestra
   si pasó o falló.
   ----------------------------------------------------- */

function registrarPrueba(nombre, paso) {

    const elemento = document.createElement("li");
    elemento.className =
        "list-group-item d-flex justify-content-between align-items-center";

    elemento.innerHTML =
        nombre +
        "<span class='badge " + (paso ? "bg-success" : "bg-danger") + "'>" +
        (paso ? "PASA" : "FALLA") + "</span>";

    resultadosPruebas.appendChild(elemento);

    // También se imprime en la consola del navegador (tecla F12)
    console.log(nombre + ": " + (paso ? "PASA" : "FALLA"));
}

async function ejecutarPruebas() {

    resultadosPruebas.innerHTML = "";

    // Prueba 1: la API responde
    let prueba = null;
    try {
        prueba = await obtenerPokemon(25);   // 25 = Pikachu
        registrarPrueba("1. La API responde correctamente", true);
    } catch (error) {
        registrarPrueba("1. La API responde correctamente", false);
        return;   // sin datos, las demás pruebas no tienen sentido
    }

    // Prueba 2: la respuesta trae los datos que el juego necesita
    registrarPrueba(
        "2. La respuesta incluye nombre, imagen y tipos",
        prueba.nombre === "pikachu" && prueba.imagen !== null && prueba.tipos.length > 0
    );

    // Prueba 3: la interfaz muestra la silueta
    registrarPrueba(
        "3. La imagen se muestra en la interfaz",
        imagenPokemon.getAttribute("src") !== ""
    );

    // Prueba 4: la comparación ignora mayúsculas, acentos, espacios y guiones
    registrarPrueba(
        "4. La comparación ignora mayúsculas, acentos y guiones",
        limpiarTexto("  PIKACHÚ ") === "pikachu" && limpiarTexto("Mr Mime") === limpiarTexto("mr-mime")
    );

    // Prueba 5: un Pokémon inexistente devuelve un error controlado
    try {
        await obtenerPokemon(99999);
        registrarPrueba("5. Un Pokémon inválido devuelve error controlado", false);
    } catch (error) {
        registrarPrueba("5. Un Pokémon inválido devuelve error controlado", true);
    }
}


/* -----------------------------------------------------
   9. EVENTOS: qué hacer cuando el usuario hace algo
   ----------------------------------------------------- */

btnAdivinar.addEventListener("click", adivinar);     // clic en "Adivinar"
btnPista.addEventListener("click", mostrarPista);    // clic en "Pista"
btnRendirse.addEventListener("click", rendirse);     // clic en "Me rindo"
btnNuevo.addEventListener("click", nuevaRonda);      // clic en "Nuevo Pokémon"
btnPruebas.addEventListener("click", ejecutarPruebas);

// También se puede responder con la tecla Enter
inputRespuesta.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        adivinar();
    }
});


/* -----------------------------------------------------
   10. AL ABRIR LA PÁGINA EMPIEZA LA PRIMERA RONDA
   ----------------------------------------------------- */

nuevaRonda();


/* =====================================================
   CARRITO DE COMPRAS
   Los botones "Agregar al carrito" de la galería
   llaman a agregarProducto() con el nombre y el
   precio del producto (ver el onclick en el HTML).
   ===================================================== */


/* -----------------------------------------------------
   11. DATOS Y ELEMENTOS DEL CARRITO
   ----------------------------------------------------- */

// Arreglo vacío donde se van guardando los productos.
// Cada producto es un objeto: { nombre: "...", precio: 500 }
const carrito = [];

const contadorCarrito = document.getElementById("contadorCarrito");
const listaCarrito = document.getElementById("listaCarrito");
const totalCarrito = document.getElementById("totalCarrito");
const btnVaciar = document.getElementById("btnVaciar");


/* -----------------------------------------------------
   12. AGREGAR, QUITAR Y VACIAR
   ----------------------------------------------------- */

function agregarProducto(nombre, precio) {

    // push() agrega un elemento al final del arreglo
    carrito.push({ nombre: nombre, precio: precio });

    actualizarCarrito();
}

function quitarProducto(indice) {

    // splice(posición, cuántos) borra elementos del arreglo
    carrito.splice(indice, 1);

    actualizarCarrito();
}

function vaciarCarrito() {

    // length = 0 borra todo el contenido del arreglo
    carrito.length = 0;

    actualizarCarrito();
}


/* -----------------------------------------------------
   13. DIBUJAR EL CARRITO
   Se vuelve a dibujar completo cada vez que cambia:
   la cantidad, la lista y el total.
   ----------------------------------------------------- */

function actualizarCarrito() {

    // Se vacía la lista antes de volver a llenarla
    listaCarrito.innerHTML = "";

    let total = 0;

    // Si no hay nada, se muestra el mensaje y se termina
    if (carrito.length === 0) {
        listaCarrito.innerHTML =
            "<p class='text-muted mb-0'>El carrito está vacío</p>";
        contadorCarrito.textContent = 0;
        totalCarrito.textContent = "0.00";
        return;
    }

    // Se recorre el arreglo.(i) sirve para saber
    // cuál producto quitar si le dan al botón de basura.
    for (let i = 0; i < carrito.length; i++) {

        const producto = carrito[i];
        total = total + producto.precio;

        const fila = document.createElement("div");
        fila.className =
            "d-flex justify-content-between align-items-center border-bottom py-2";

        fila.innerHTML =
            "<span class='small'>" + producto.nombre + "</span>" +
            "<span class='text-nowrap'>" +
            "<span class='me-2'>$" + producto.precio.toFixed(2) + "</span>" +
            "<button class='btn btn-sm btn-outline-danger' onclick='quitarProducto(" + i + ")'>" +
            "<i class='bi bi-trash'></i></button>" +
            "</span>";

        listaCarrito.appendChild(fila);
    }

    // Número del contador azul
    contadorCarrito.textContent = carrito.length;

    // toFixed(2) deja el total con dos decimales
    totalCarrito.textContent = total.toFixed(2);
}


/* -----------------------------------------------------
   14. EVENTOS DEL CARRITO
   ----------------------------------------------------- */

btnVaciar.addEventListener("click", vaciarCarrito);