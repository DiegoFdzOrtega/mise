# Proyecto intermodular · RA1
## Identificación de necesidades del sector productivo

**Proyecto:** Mise: software de gestión de sala y cocina para restaurantes pequeños
**Cliente piloto:** Restaurante Diego (Bétera, Valencia)
**Alumno:** Diego Fernández Ortega
**Ciclo:** CFGS Desarrollo de Aplicaciones Multiplataforma (2º curso)
**Módulo:** Proyecto intermodular
**Resultado de aprendizaje 1:** *Identifica necesidades del sector productivo, relacionándolas con proyectos tipo que puedan satisfacerlas.*

---

## Índice

1. [Introducción y motivación](#1-introducción-y-motivación)
   - [El nombre: Mise](#el-nombre-mise)
   - [Cliente piloto: Restaurante Diego](#cliente-piloto-restaurante-diego)
2. [Clasificación de las empresas del sector (CE a)](#2-clasificación-de-las-empresas-del-sector-ce-a)
3. [Empresa tipo: estructura y departamentos (CE b)](#3-empresa-tipo-estructura-y-departamentos-ce-b)
4. [Necesidades más demandadas (CE c)](#4-necesidades-más-demandadas-ce-c)
5. [Oportunidades de negocio (CE d)](#5-oportunidades-de-negocio-ce-d)
6. [Tipo de proyecto que responde a la demanda (CE e)](#6-tipo-de-proyecto-que-responde-a-la-demanda-ce-e)
7. [Características específicas del proyecto (CE f)](#7-características-específicas-del-proyecto-ce-f)
8. [Obligaciones fiscales, laborales y de prevención de riesgos (CE g)](#8-obligaciones-fiscales-laborales-y-de-prevención-de-riesgos-ce-g)
9. [Ayudas y subvenciones (CE h)](#9-ayudas-y-subvenciones-ce-h)
10. [Guion de trabajo (CE i)](#10-guion-de-trabajo-ce-i)
11. [Relación con otros módulos (carácter intermodular)](#11-relación-con-otros-módulos-carácter-intermodular)
12. [Contribución a los ODS](#12-contribución-a-los-ods)
13. [Conclusiones](#13-conclusiones)
14. [Fuentes](#14-fuentes)

---

## 1. Introducción y motivación

Antes de estudiar informática trabajé más de cinco años como **encargado de cocina**. En ese tiempo vi siempre los mismos problemas en restaurantes pequeños:

- El **inventario** se lleva "de cabeza" o en una libreta, y los pedidos se hacen tarde o de más.
- Nadie sabe con exactitud **cuánto cuesta cada plato**, así que los precios de la carta se ponen "a ojo".
- Los **registros de temperatura** que exige el plan de higiene (APPCC) se rellenan en papel, se pierden o se rellenan todos de golpe antes de una inspección.
- La **carta de alérgenos** se actualiza a mano y, si cambia una receta, se queda desfasada.
- La comida que se tira (**mermas**) no se mide, por lo que no se puede reducir.

Este proyecto parte de ese conocimiento real. Analiza el **sector del desarrollo de software** (el de nuestro título) y su relación con un cliente concreto, la **hostelería**, para proponer un producto que resuelva esas necesidades: **Mise**.

### El nombre: Mise

En cocina, ***mise en place*** (en francés, "puesto en su sitio") es tenerlo todo preparado y en orden antes de que empiece el servicio: el género cortado, las salsas hechas, cada cosa en su recipiente. Cualquier cocinero conoce la expresión y la usa a diario, muchas veces abreviada como "la mise".

Es justo lo que hace la app: que la cocina tenga **el stock, los costes, los registros y los pedidos en su sitio**. Es un nombre corto, fácil de recordar, que se entiende en cualquier cocina del mundo y que funciona como marca (*"¿Has hecho la Mise?"*). Lema: ***Tu cocina, en su sitio.***

### Cliente piloto: Restaurante Diego

Para que el análisis sea concreto, el proyecto se diseña alrededor de un caso de estudio: **Restaurante Diego**, un restaurante de cocina valenciana en **Bétera (Valencia)**.

| Dato | Valor |
|---|---|
| Tipo | Restaurante independiente de cocina valenciana (arroces, producto de mercado) |
| Servicios | Comidas todos los días y cenas de jueves a sábado |
| Plantilla | 6 personas: el propietario (administrador), una jefa de cocina, dos cocineros y dos camareros |
| Carta | 24 referencias: 7 entrantes, 5 arroces, 2 pescados, 1 carne, 3 postres y 6 bebidas |
| Sala | 12 mesas (8 en el salón y 4 en la terraza). Cierra los lunes |
| Proveedores | 6 (carnicería, pescado, verdura, secos, lácteos y panadería), casi todos de la comarca |
| Cámaras | 3 de refrigeración (carnes, pescado, verdura y lácteos) y 1 arcón congelador |
| Cómo se gestionaba antes | Comandas en libreta que se "cantaban" a cocina, pedidos por WhatsApp de memoria, temperaturas en una hoja pegada a la cámara, carta de alérgenos en Word |

Los datos de ejemplo de la app (precios, platos, proveedores, cuatro semanas de ventas y tres de registros) reproducen este restaurante, de forma que el prototipo se puede enseñar como si estuviera en uso real. Los nombres de los proveedores y los teléfonos son inventados.

> **Términos que aparecen en el documento**
> - **Escandallo:** ficha que calcula el coste de un plato sumando lo que cuesta cada ingrediente en la cantidad usada.
> - **Food cost:** porcentaje del precio de venta (sin IVA) que se va en materia prima. En restauración se suele buscar entre un 25 % y un 35 %.
> - **APPCC:** *Análisis de Peligros y Puntos de Control Crítico*. Es el plan de seguridad alimentaria obligatorio en cualquier cocina; incluye, entre otras cosas, vigilar las temperaturas.
> - **Merma:** producto que se pierde (caduca, se estropea, sobra…).
> - **PWA (Progressive Web App):** web que se puede "instalar" en el móvil o el PC como si fuera una app y que funciona sin internet.
> - **SaaS (Software as a Service):** software que se paga con una suscripción y se usa desde internet, sin instalar nada.

---

## 2. Clasificación de las empresas del sector (CE a)

El sector productivo del título DAM es el de las **empresas que desarrollan software** para distintas plataformas (escritorio, web y móvil). Se pueden clasificar según cómo se organizan y qué ofrecen:

| Tipo de empresa | Qué ofrece | Organización típica | Ejemplo de cliente |
|---|---|---|---|
| **Consultora / integradora** | Proyectos a medida, implantación de ERP/CRM, personal desplazado a cliente | Grande o mediana, por proyectos y áreas (banca, sanidad…) | Banco, administración pública |
| **Factoría de software** | Desarrollo por encargo, con requisitos cerrados | Mediana, por equipos de desarrollo y QA | Otras consultoras, empresas medianas |
| **Empresa de producto (SaaS)** | Un producto propio que se vende por suscripción | Pequeña o mediana, por producto: desarrollo, soporte, ventas | Pymes y autónomos de un sector concreto |
| **Startup** | Producto innovador en fase de validación | Muy pequeña y plana; cada persona hace de todo | Mercado nicho |
| **Departamento TI interno** | Mantener y crear aplicaciones para su propia empresa | Dentro de una empresa no tecnológica | La propia empresa |
| **Profesional autónomo (freelance)** | Webs, apps y mantenimiento para negocios locales | Una persona, a veces con colaboradores | Comercios, bares, clínicas |

**Según el producto o servicio:** desarrollo a medida, producto propio (licencia o suscripción), mantenimiento y soporte, implantación y formación, y consultoría.

**Según el tamaño:** la mayoría del tejido es **pyme y microempresa**, que es también el perfil de cliente de este proyecto.

---

## 3. Empresa tipo: estructura y departamentos (CE b)

Para el proyecto se toma como modelo una **pequeña empresa de producto SaaS** (de 5 a 10 personas), que es la forma más realista de llevar *Mise* al mercado.

```
                    ┌────────────────────┐
                    │  Dirección / CEO   │
                    └─────────┬──────────┘
        ┌──────────────┬──────┴───────┬──────────────────┐
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────┐ ┌─────▼──────────┐
│  Producto y  │ │ Desarrollo │ │ Soporte y      │ │ Comercial y    │
│  diseño UX   │ │ y QA       │ │ atención       │ │ marketing      │
└──────────────┘ └────────────┘ └────────────────┘ └────────────────┘
                 (Administración y gestoría externalizadas)
```

| Departamento | Funciones |
|---|---|
| **Dirección** | Decide la estrategia, el presupuesto y las prioridades. Busca financiación y ayudas. |
| **Producto y diseño UX** | Habla con los clientes, define qué funciones hacer y diseña las pantallas para que sean fáciles de usar. |
| **Desarrollo y QA** | Programa la app (web, móvil, servidor), la prueba (QA = control de calidad) y la publica. |
| **Soporte** | Resuelve dudas e incidencias de los clientes, da formación y recoge sugerencias. |
| **Comercial y marketing** | Capta clientes (ferias de hostelería, redes sociales, asociaciones del sector) y gestiona las suscripciones. |
| **Administración** | Facturación, nóminas e impuestos. En una empresa tan pequeña suele hacerlo una gestoría externa. |

En la fase inicial (este proyecto), **una sola persona** cubre producto, desarrollo y soporte, que es lo normal en una startup.

---

## 4. Necesidades más demandadas (CE c)

### 4.1 Lo que el mercado pide a las empresas de software

- **Digitalizar a las pymes:** sustituir papel y hojas de cálculo por aplicaciones sencillas.
- **Multiplataforma:** que funcione en el móvil de la cocina, la tablet y el ordenador de la oficina.
- **Facilidad de uso:** personal con poca formación técnica y con prisas.
- **Cumplimiento normativo:** que la herramienta ayude a cumplir las leyes del sector (higiene, alérgenos, desperdicio, protección de datos).
- **Precio asequible** y pago mensual sin grandes inversiones.
- **Funcionamiento sin conexión:** en muchas cocinas la cobertura es mala.

### 4.2 Necesidades concretas del cliente objetivo: la hostelería

El cliente es un sector con muchísimos negocios pequeños. Con datos de 2023, la restauración en España reunía **unas 232.000 empresas y unos 264.000 establecimientos**, de los que alrededor del **62 % son bares y cafeterías y el 31 % restaurantes**. La mayoría son negocios independientes, no cadenas.

| Necesidad | Cómo se resuelve hoy | Problema |
|---|---|---|
| Controlar stock y caducidades | Libreta, memoria | Roturas de stock, compras de más, producto caducado |
| Pasar las comandas de sala a cocina | Libreta y "cantar" la comanda | Platos olvidados, alergias que no llegan a cocina, esperas sin control |
| Saber cuánto se vende y qué se gana | Cierre de caja en papel | No se sabe qué platos dejan margen ni cuál es el ticket medio |
| Controlar quién hace cada cosa | Todo el mundo usa lo mismo | Registros APPCC sin firma fiable, cualquiera puede tocar precios |
| Hacer los pedidos a proveedores | Mensajes de WhatsApp escritos de memoria al cierre | Se olvidan productos, se pide tarde (cada proveedor tiene su hora límite) |
| Conocer el coste de cada plato | Calculado una vez en Excel o nunca | Precios mal puestos; si sube un proveedor, no se nota |
| Registrar temperaturas (APPCC) | Hojas en papel en la puerta de la cámara | Se pierden, se rellenan tarde, mala imagen ante inspección |
| Informar de alérgenos | Carta hecha a mano | Desfasada cuando cambia una receta → riesgo para el cliente |
| Medir y reducir el desperdicio | No se mide | Ahora la ley obliga a tener un plan de prevención |

---

## 5. Oportunidades de negocio (CE d)

1. **Nueva obligación legal.** La **Ley 1/2025 de prevención de las pérdidas y el desperdicio alimentario** obliga a los establecimientos de hostelería a **elaborar y aplicar un plan de prevención** del desperdicio. Sus obligaciones generales se aplican **desde el 2 de abril de 2026**, así que muchos restaurantes necesitan ahora mismo una forma sencilla de registrar y reducir sus mermas.
2. **El sector se está profesionalizando.** La restauración organizada (cadenas y franquicias) crece más rápido que los restaurantes independientes. Los independientes necesitan herramientas de gestión parecidas a las de las cadenas para poder competir.
3. **Hueco en el mercado.** Ya existen programas de gestión de cocina en España, pero suelen estar pensados para grupos de restauración, con muchas funciones y una curva de aprendizaje alta. Hay espacio para una herramienta **simple, barata, en español y pensada para un solo local**.
4. **Conocimiento del sector.** Mi experiencia como encargado de cocina es una ventaja: conozco el vocabulario, los procesos y los problemas reales.
5. **Ampliaciones futuras con valor:** pedidos automáticos a proveedores, lectura de albaranes con el móvil, sensores de temperatura conectados (IoT), varias sedes.

**Modelo de negocio propuesto (freemium):**

| Plan | Qué incluye | Precio orientativo |
|---|---|---|
| **Gratis** | 1 local, datos en el dispositivo: inventario, carta y costes, APPCC, alérgenos y mermas | 0 € |
| **Pro** | Sala y comandas, pantalla de cocina, sincronización entre dispositivos, copias en la nube, informes | Suscripción mensual baja (a validar con clientes) |

---

## 6. Tipo de proyecto que responde a la demanda (CE e)

Se propone un **proyecto de desarrollo de producto software** del tipo **aplicación multiplataforma (PWA)**:

- **Una sola base de código** (HTML, CSS y JavaScript) que funciona en **PC, tablet y móvil**, y se puede **instalar** como una app.
- **Funciona sin conexión** gracias a un *service worker* (un pequeño programa que guarda la app en el dispositivo).
- **Primera versión sin servidor**: los datos se guardan en el propio navegador y se pueden exportar e importar en JSON. Así el coste de mantener la app es casi cero y se puede validar con restaurantes reales.
- **Segunda fase** (RA siguientes): servidor con base de datos para sincronizar varios dispositivos (las tablets de sala, la pantalla de cocina y el móvil del dueño).

Se elige PWA y no una app nativa (Android/iOS) porque una cocina suele tener dispositivos de todo tipo, porque se publica sin pasar por las tiendas de apps y porque permite enseñarla con un simple enlace.

---

## 7. Características específicas del proyecto (CE f)

### 7.1 Requisitos funcionales (qué hace la app)

| Código | Módulo | Requisito |
|---|---|---|
| RF-01 | Acceso | Entrar con usuario y PIN de 4 cifras. Bloquear tras 5 intentos fallidos y tras unos minutos sin uso. |
| RF-02 | Roles | Cuatro roles (administrador, jefe de cocina, cocinero y camarero), cada uno con sus pantallas y permisos. |
| RF-03 | Usuarios | El administrador da de alta al personal, cambia los PIN y activa o desactiva cuentas. |
| RF-04 | Sala | Plano de mesas con su estado; abrir mesa con comensales y alergias; tomar la comanda con notas para cocina. |
| RF-05 | Sala | Avisar si se pide un plato con un alérgeno de la mesa y bloquear los platos agotados o sin stock. |
| RF-06 | Sala | Cobrar la mesa (tarjeta, efectivo con cambio, Bizum) con desglose de IVA. |
| RF-07 | Cocina | Pantalla de comandas en directo (en cola, preparando, en el pase), con tiempos de espera y alergias destacadas. |
| RF-08 | Stock | Descontar automáticamente del inventario los ingredientes de cada plato enviado a cocina. |
| RF-09 | Informes | Facturación, ticket medio, food cost real, margen, platos más vendidos y ventas por día, categoría, camarero y forma de pago. |
| RF-10 | Panel | Mostrar un resumen con avisos: caducidades, stock bajo mínimo, cámaras sin registrar y platos poco rentables. |
| RF-11 | Inventario | Dar de alta, editar y borrar ingredientes con unidad, precio, stock, mínimo, caducidad y alérgenos. |
| RF-12 | Inventario | Registrar entradas y salidas de stock y actualizar el precio de compra. |
| RF-13 | Pedidos | Generar automáticamente un pedido por proveedor con lo que está bajo mínimo, con la cantidad sugerida, el coste estimado y la hora límite para pedir. |
| RF-14 | Pedidos | Copiar el pedido como mensaje listo para enviar por WhatsApp o email, y marcarlo como recibido para sumar el género al stock. |
| RF-15 | Proveedores | Dar de alta proveedores con teléfono, días de reparto y hora límite de pedido. |
| RF-16 | Escandallos | Crear platos con sus ingredientes y cantidades por ración. |
| RF-17 | Escandallos | Calcular coste, food cost, margen y precio recomendado según un objetivo. |
| RF-18 | APPCC | Registrar temperaturas por cámara y turno (mañana y tarde) con responsable y fecha, y avisar si falta el registro del turno. |
| RF-19 | APPCC | Detectar temperaturas fuera de rango y **obligar** a escribir una acción correctora. |
| RF-20 | APPCC | Exportar el historial a CSV para enseñarlo en una inspección. |
| RF-21 | Alérgenos | Generar automáticamente la matriz de los 14 alérgenos por plato e imprimirla. |
| RF-22 | Mermas | Registrar mermas con motivo y destino (según la jerarquía de la Ley 1/2025) y descontarlas del stock. |
| RF-23 | Mermas | Mostrar coste del desperdicio, porcentaje aprovechado y producto más desperdiciado. |
| RF-24 | Ajustes | Configurar el negocio (nombre, localidad, IVA, food cost objetivo) y hacer copias de seguridad. |
| RF-25 | Equipo | Gestionar el equipo de cocina y elegir quién está trabajando, para que los registros se firmen a su nombre. |

### 7.2 Requisitos no funcionales (cómo debe ser)

- **Multiplataforma y adaptable:** se ve bien desde 360 px de ancho (móvil) hasta pantallas grandes.
- **Sin conexión:** funciona sin internet una vez instalada.
- **Usabilidad:** botones grandes, pocas pantallas, textos en lenguaje de cocina (no técnico).
- **Seguridad:** los PIN no se guardan, solo su *hash* SHA-256 con una "sal" distinta por usuario (un hash es una huella de la que no se puede sacar el PIN original). Hay permisos por rol en cada pantalla y en cada botón, bloqueo automático y protección contra intentos repetidos. Todo texto que escribe el usuario se "escapa" antes de mostrarse, para evitar ataques XSS (inyección de código en la página).
- **Tiempo real:** lo que pide sala aparece en cocina sin recargar (en esta versión entre pestañas del mismo equipo; con servidor, entre dispositivos).
- **Privacidad:** en la versión gratuita los datos no salen del dispositivo.
- **Accesibilidad:** contraste alto, navegación con teclado y etiquetas en los formularios.
- **Mantenibilidad:** código separado en capas (datos, cálculos, interfaz) y comentado.

### 7.3 Normativa del cliente que la app ayuda a cumplir

- **Reglamento (CE) 852/2004**, de higiene de los productos alimenticios (base del APPCC).
- **Reglamento (UE) 1169/2011**, de información alimentaria al consumidor (14 alérgenos).
- **Ley 1/2025**, de prevención de las pérdidas y el desperdicio alimentario.

---

## 8. Obligaciones fiscales, laborales y de prevención de riesgos (CE g)

Se supone que el proyecto se lanza como **trabajador autónomo** y, si crece, como **sociedad limitada (S.L.)**.

### 8.1 Fiscales

| Obligación | Qué es | Cuándo |
|---|---|---|
| **Alta censal** (modelo 036/037) | Darse de alta en Hacienda como actividad económica | Antes de empezar a facturar |
| **IAE** | Impuesto de Actividades Económicas. Hay que darse de alta en el epígrafe de programación informática, pero los autónomos y las sociedades que facturan menos de 1 millón de € no lo pagan | Al iniciar la actividad |
| **IVA** (modelo 303 y resumen anual 390) | Se cobra IVA en cada suscripción y se ingresa a Hacienda | Trimestral |
| **IRPF** (modelo 130) | Pago a cuenta del impuesto sobre la renta del autónomo | Trimestral |
| **Facturación** | Las facturas deben cumplir el reglamento de facturación y los nuevos requisitos de sistemas informáticos de facturación (Verifactu). Hay que comprobar en la web de la AEAT el calendario de obligatoriedad vigente | Siempre |
| **Impuesto de Sociedades** (si es S.L.) | Impuesto sobre el beneficio de la empresa | Anual |

### 8.2 Laborales

- **Alta en el RETA** (Régimen Especial de Trabajadores Autónomos) de la Seguridad Social y pago de la cuota mensual, que depende de los ingresos reales.
- Si se contrata personal: alta de la empresa en la Seguridad Social, contratos, nóminas y aplicar el **convenio colectivo** de la actividad (en empresas de software suele ser el convenio estatal de empresas de consultoría, tecnologías de la información y estudios de mercado).

### 8.3 Prevención de riesgos laborales

- **Ley 31/1995 de Prevención de Riesgos Laborales:** evaluación de riesgos y plan de prevención (normalmente con un servicio de prevención ajeno).
- **RD 488/1997, trabajo con pantallas de visualización:** el principal riesgo de un programador. Silla y mesa adecuadas, pantalla a la altura de los ojos, buena iluminación y pausas.
- Riesgos ergonómicos (postura, muñecas) y psicosociales (estrés por plazos), además de las salidas a restaurantes para formación y soporte.

### 8.4 Protección de datos

- **RGPD y LOPDGDD:** en la versión Pro se guardarán datos personales (nombres de empleados que firman los registros, emails). Hará falta un contrato de **encargado del tratamiento** con cada restaurante, una política de privacidad y medidas de seguridad.
- **LSSI:** aviso legal y condiciones en la web de venta del servicio.

---

## 9. Ayudas y subvenciones (CE h)

| Ayuda | Para quién | Situación |
|---|---|---|
| **Kit Digital** (Red.es) | Pymes y autónomos para comprar soluciones digitales | El plazo de la última convocatoria terminó el 30 de junio de 2025. Sirve como referencia: *Mise* podría haberse ofrecido como solución subvencionable. |
| **Programas de las Cámaras de Comercio** | Pymes que quieren digitalizarse | Siguen convocándose en 2026 con un esquema de **diagnóstico** del nivel digital y, después, **ayudas para implantar** las mejoras. Útil para que los restaurantes clientes paguen menos. |
| **IVACE (Comunitat Valenciana)** | Pymes valencianas con proyectos de digitalización | Hay líneas autonómicas que financian software y desarrollos a medida. Hay que consultar la convocatoria de cada año. |
| **ENISA (préstamos participativos)** | Startups y emprendedores | Financiación sin avales para empresas innovadoras. |
| **Tarifa plana de autónomos** | Nuevos autónomos | Cuota reducida durante el primer año de actividad. |
| **Capitalización del paro** | Desempleados que emprenden | Cobrar la prestación de una vez para invertir en el negocio. |

Hay dos tipos de ayudas: las que reciben **los clientes** para comprar software (hacen la venta más fácil) y las que recibe **la empresa** para crear el producto.

---

## 10. Guion de trabajo (CE i)

| Fase | RA | Tareas principales | Entregable |
|---|---|---|---|
| **1. Análisis** | RA1 | Estudio del sector, necesidades, requisitos, viabilidad. **Prototipo funcional** para validar la idea | Esta memoria + prototipo PWA |
| **2. Diseño** | RA2 | Casos de uso, modelo de datos (diagrama E-R), prototipos de pantalla, arquitectura cliente-servidor del plan Pro, presupuesto | Documento de diseño |
| **3. Planificación** | RA3 | Cronograma (diagrama de Gantt), recursos, riesgos, plan de pruebas | Plan del proyecto |
| **4. Ejecución y seguimiento** | RA4 | Desarrollo por iteraciones cortas (*sprints* de 2 semanas), control de versiones con Git/GitHub, pruebas con 2–3 restaurantes reales, registro de incidencias | Versión 1.0 + informe de seguimiento |
| **5. Cierre** | — | Memoria final, manual de usuario, presentación y defensa | Memoria y defensa oral |

**Metodología:** ágil (inspirada en Scrum) con un tablero de tareas en GitHub Projects. Cada función nueva se trabaja en una rama de Git y se integra cuando funciona.

**Herramientas:** VS Code, Git y GitHub, GitHub Pages (publicación), Chrome DevTools (pruebas y modo móvil), Lighthouse (auditoría PWA y accesibilidad).

---

## 11. Relación con otros módulos (carácter intermodular)

| Módulo | Cómo se aplica en *Mise* |
|---|---|
| **Programación** (1º) | Lógica de la aplicación, funciones y estructuras de datos en JavaScript |
| **Bases de datos** (1º) | Modelo de datos con entidades relacionadas: ingrediente, plato, línea de escandallo, cámara, registro, merma |
| **Lenguajes de marcas** (1º) | HTML semántico, CSS, JSON y CSV |
| **Entornos de desarrollo** (1º) | Git, GitHub, depuración y pruebas |
| **Acceso a datos** (2º) | Capa de datos separada (`datos.js`): guardar, leer, exportar e importar |
| **Desarrollo de interfaces** (2º) | Interfaz adaptable, formularios, accesibilidad, informes imprimibles |
| **Programación multimedia y dispositivos móviles** (2º) | PWA instalable en el móvil, diseño para pantalla táctil |
| **Programación de servicios y procesos** (2º) | *Service worker* que trabaja en segundo plano; sincronización entre pestañas (sala ↔ cocina) y refresco periódico; seguridad (hash de contraseñas, sesiones) |
| **Sistemas de gestión empresarial** (2º) | Ventas (TPV), inventario, compras a proveedores, costes, usuarios con roles e informes, igual que los módulos de un ERP |
| **Digitalización aplicada / Sostenibilidad** | Digitalización de una pyme de un sector tradicional y reducción del desperdicio |
| **Empleabilidad / Empresa** | Modelo de negocio, obligaciones fiscales y ayudas |

---

## 12. Contribución a los ODS

- **ODS 12 – Producción y consumo responsables (meta 12.3):** reducir a la mitad el desperdicio de alimentos. El módulo de mermas mide el desperdicio y empuja a aprovecharlo antes que tirarlo.
- **ODS 3 – Salud y bienestar:** control de temperaturas e información fiable de alérgenos.
- **ODS 8 – Trabajo decente y crecimiento económico:** ayuda a que los pequeños negocios sean más rentables y viables.
- **ODS 9 – Industria, innovación e infraestructura:** digitalización de pymes de un sector tradicional.

---

## 13. Conclusiones

La hostelería española está formada sobre todo por **negocios pequeños e independientes**, que llevan su gestión en papel y ahora tienen **nuevas obligaciones legales** (plan de prevención del desperdicio desde abril de 2026). Las empresas de software tienen una oportunidad clara de ofrecerles **herramientas sencillas, baratas y multiplataforma**.

*Mise* responde a esa necesidad con un producto realista, basado en experiencia real de cocina, y ya cuenta con un **prototipo funcional**, cargado con los datos de Restaurante Diego, que permite enseñárselo a restaurantes y validar la idea antes de pasar al diseño completo (RA2).

---

## 14. Fuentes

- Hostelería de España. *Anuario de la Hostelería de España 2025*. https://otea.es/wp-content/uploads/2025/12/ANUARIO-HOSTELERIA-2025.pdf
- 10 Minutos Hotel. *Radiografía del sector de la restauración en España* (datos INE 2023). https://es.10minhotel.com/2024/07/27/radiografia-del-sector-de-la-restauracion-en-espana
- Statista. *Número de empresas del sector de la hostelería en España por actividad principal*. https://es.statista.com/estadisticas/645780/numero-de-empresas-del-sector-de-la-hosteleria-por-actividad-principal-espana
- Vozpópuli. *Las 'big four' de la restauración organizada centran las aperturas del sector*. https://www.vozpopuli.com/economia/empresas/las-big-four-de-la-restauracion-organizada-centran-las-aperturas-del-sector.html
- BOE. *Ley 1/2025, de 1 de abril, de prevención de las pérdidas y el desperdicio alimentario* (resumen en Iberley). https://www.iberley.es/legislacion/ley-1-2025-de-1-de-abril-de-prevencion-de-las-perdidas-y-el-desperdicio-alimentario-legislacion-27283126
- Fieldfisher. *Ley 1/2025: obligaciones, ventajas y riesgos*. https://www.fieldfisher.com/es-es/locations/espana/actualidad/ley-de-prevencion-de-las-perdidas-y-el-desperdicio-alimentario
- Legálitas. *Ley de desperdicio alimentario: qué es y qué implica*. https://www.legalitas.com/actualidad/ley-desperdicio-alimentario
- MAPA. *Preguntas y respuestas sobre la ley del desperdicio*. https://servicio.mapa.gob.es/ca/alimentacion/temas/desperdicio/cuestionariodepreguntasyrespuestassobrelaleydeldesperdicio_tcm34-707324.pdf
- TeamSystem. *Kit Digital 2026*. https://teamsystem.es/magazine/kit-digital-2026/
- Finantres. *Después de Kit Digital: qué ayudas siguen vivas para pymes*. https://finantresnoticias.com/negocios-y-autonomos/ayudas-tras-fin-de-kit-digital-que-sigue-vivo-para-pymes/
- IES Mutxamel. *Criterios de evaluación de Proyecto Intermodular DAM*. https://portal.edu.gva.es/iesmutxamel/wp-content/uploads/sites/691/2026/02/CE_PI1DAM_DAM_2025-2026.pdf
- Reglamento (CE) 852/2004, relativo a la higiene de los productos alimenticios.
- Reglamento (UE) 1169/2011, sobre la información alimentaria facilitada al consumidor.
- Ley 31/1995, de Prevención de Riesgos Laborales, y RD 488/1997, sobre pantallas de visualización.
