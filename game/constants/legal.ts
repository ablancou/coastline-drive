/**
 * Privacy notice + terms, written to honestly reflect what Coastline Drive does:
 * no accounts, no analytics/tracking cookies, only localStorage for lap times,
 * hosted on Vercel, and original (non-branded) car designs.
 *
 * Note: this is a good-faith plain-language template, not legal advice.
 */
export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const PRIVACY: LegalDoc = {
  title: "Aviso de Privacidad",
  updated: "22 de junio de 2026",
  intro:
    "Tu privacidad importa. Coastline Drive es un juego web que funciona casi por completo en tu dispositivo y está pensado para recopilar la menor cantidad de datos posible.",
  sections: [
    {
      heading: "1. Responsable",
      paragraphs: [
        "El responsable de este sitio es Armando Blanco. Puedes contactarlo a través de su portafolio: https://www.armandoblanco.dev/.",
      ],
    },
    {
      heading: "2. Qué datos tratamos",
      paragraphs: [
        "No solicitamos registro ni recopilamos datos personales identificables (nombre, correo, etc.).",
        "El juego guarda de forma local en tu navegador (localStorage) únicamente tus mejores tiempos de vuelta y tus preferencias de configuración. Esa información permanece en tu dispositivo, no se envía a ningún servidor nuestro y puedes eliminarla en cualquier momento borrando los datos del sitio en tu navegador.",
      ],
    },
    {
      heading: "3. Cookies y rastreo",
      paragraphs: [
        "No utilizamos cookies publicitarias ni herramientas de analítica o rastreo de terceros.",
      ],
    },
    {
      heading: "4. Alojamiento",
      paragraphs: [
        "El sitio se aloja en Vercel. Como cualquier proveedor de hosting, Vercel puede registrar datos técnicos estándar (por ejemplo, dirección IP y tipo de navegador) en sus registros de servidor para operar y proteger el servicio, conforme a su propia política de privacidad (https://vercel.com/legal/privacy-policy).",
      ],
    },
    {
      heading: "5. Tus derechos",
      paragraphs: [
        "Como no mantenemos perfiles ni bases de datos personales, no almacenamos información tuya que podamos consultar o eliminar a petición. Si tienes dudas sobre privacidad, escribe a través del portafolio del responsable.",
      ],
    },
    {
      heading: "6. Cambios",
      paragraphs: [
        "Podemos actualizar este aviso. La fecha de la última actualización aparece al inicio del documento.",
      ],
    },
  ],
};

export const TERMS: LegalDoc = {
  title: "Términos y Condiciones",
  updated: "22 de junio de 2026",
  intro:
    "Al acceder y usar Coastline Drive aceptas los siguientes términos. Si no estás de acuerdo, por favor no utilices el sitio.",
  sections: [
    {
      heading: "1. El servicio",
      paragraphs: [
        "Coastline Drive es un prototipo y demostración técnica gratuita, ofrecido con fines de portafolio y entretenimiento.",
      ],
    },
    {
      heading: "2. Propiedad intelectual",
      paragraphs: [
        "El código y los recursos originales del juego son propiedad de Armando Blanco. Los recursos de terceros empleados (por ejemplo, cielos HDRI y la textura del globo) son de licencia CC0 o de dominio público y se acreditan en el manifiesto de recursos del proyecto.",
      ],
    },
    {
      heading: "3. Marcas y no afiliación",
      paragraphs: [
        "Coastline Drive no está afiliado, patrocinado ni respaldado por Porsche ni por ninguna otra marca automotriz.",
        "Los vehículos del juego son diseños originales inspirados libremente en siluetas clásicas; no son reproducciones de modelos reales ni utilizan nombres, logotipos o marcas registradas de terceros.",
      ],
    },
    {
      heading: "4. Uso aceptable",
      paragraphs: [
        "Te comprometes a no intentar dañar, vulnerar, sobrecargar ni utilizar el servicio de forma ilícita o contraria a estos términos.",
      ],
    },
    {
      heading: "5. Garantías y responsabilidad",
      paragraphs: [
        'El servicio se ofrece "tal cual" y "según disponibilidad", sin garantías de funcionamiento ininterrumpido o libre de errores.',
        "En la medida en que la ley aplicable lo permita, el autor no será responsable por daños directos o indirectos derivados del uso o la imposibilidad de uso del sitio.",
      ],
    },
    {
      heading: "6. Cambios y contacto",
      paragraphs: [
        "Podemos modificar estos términos en cualquier momento. El uso continuado del sitio implica la aceptación de la versión vigente.",
        "Para cualquier consulta, contacta al autor a través de https://www.armandoblanco.dev/.",
      ],
    },
  ],
};
