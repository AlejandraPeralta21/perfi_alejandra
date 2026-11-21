/* Datos de ejemplo, filtros, artistas, canciones y paginación */
(function ($) {
  const KT = window.KT = window.KT || {};
  KT.ic = id => `<svg class="ic" aria-hidden="true"><use href="#i-${id}"></use></svg>`;
  // PUNTO 4 · ANTI-XSS: helper central para valores que deban ir dentro de una cadena HTML.
  // Convierte &, <, > y comillas en entidades para que el navegador los muestre como texto,
  // no como etiquetas o atributos ejecutables. Para insertar datos en nodos, preferir .text().
  KT.escapeHTML = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  KT.initials = initials;

  KT.CATS = [
    { id: 'todos', name: 'Todos', icon: 'grid', subs: [] },
    { id: 'pop', name: 'Pop', icon: 'mic', subs: ['Pop latino', 'Pop internacional'] },
    { id: 'baladas', name: 'Baladas', icon: 'heart', subs: ['Románticas', 'Despecho', 'Clásicas'] },
    { id: 'rock', name: 'Rock', icon: 'bolt', subs: ['Rock en español', 'Rock internacional'] },
    { id: 'regional', name: 'Regional', icon: 'hat', subs: ['Rancheras', 'Mariachi', 'Regional mexicano'] },
    { id: 'latino', name: 'Latino', icon: 'globe', subs: ['Salsa', 'Bachata', 'Reguetón'] },
    { id: 'clasicos', name: 'Clásicos', icon: 'diamond', subs: ['Años 80', 'Años 90', 'Años 2000'] },
    { id: 'boliviana', name: 'Música boliviana', icon: 'mountain', subs: ['Folclore', 'Cumbia', 'Música nacional'] }
  ];

  // Pega el enlace compartido de Dropbox entre las comillas de cada artista.
  const ARTIST_IMAGES = {
    'cristian-castro': 'https://www.dropbox.com/scl/fi/g6ca42ehszhlpm0iqf377/cristian.webp?rlkey=cgya2w2qwpzmssibt61agiu5c&st=laj9ginm&dl=0',
    'taylor-swift': 'https://www.dropbox.com/scl/fi/wmh4ws2xsdhp9g8z4j4xw/tylor.webp?rlkey=u67nli9iyydor685a073gzr4y&st=mvl7iyt1&dl=0',
    'shawn-mendes': 'https://www.dropbox.com/scl/fi/w40iup9qrmaxb2enskzky/shawmendes.webp?rlkey=agzt4v0z48juixacy7g7o1amk&st=vlg8itmr&dl=0',
    'morat': 'https://www.dropbox.com/scl/fi/wh1t496gishozls3on0xl/morat.webp?rlkey=x1a6d2cuq1817amscqr9apkgo&st=zv6jptrm&dl=0',
    'reik': 'https://www.dropbox.com/scl/fi/w77yb2yyprk0b03llagdt/reik.webp?rlkey=3dnufo61k0t7agthc2uvs0lsg&st=70xiftuy&dl=0',
    'humbe': 'https://www.dropbox.com/scl/fi/3gnaqzlmhkz2l1ygjcvgo/humbe.webp?rlkey=2k3wrt41k6pitnw21lxcucpe1&st=a3smpwom&dl=0',
    'luis-miguel': 'https://www.dropbox.com/scl/fi/dn9vk2x6in4jm8xzeoc3v/luismiguel.webp?rlkey=x5j1lm53qfpwrqk0mkqbkiyfp&st=lkuzqig2&dl=0',
    'shakira': 'https://www.dropbox.com/scl/fi/moyfo825esod7pklim7ek/shakira.webp?rlkey=v6w9a9cpnnnvjb0zgmhlujxl1&st=nmzkq4nm&dl=0',
    'karol-g': 'https://www.dropbox.com/scl/fi/tou8fxwf4z9flx5bh57v6/karolg.webp?rlkey=qcqivtnrp4wwfu937k4cn7w5l&st=893pk963&dl=0',
    'bruno-mars': 'https://www.dropbox.com/scl/fi/cm26met0ytj94uhou9t7c/brunomars.webp?rlkey=vx4a3w0xwul0q2w2436wd2a8l&st=e72gss3q&dl=0',
    'adele': 'https://www.dropbox.com/scl/fi/2de8hxku2cffw5ve5ex6y/adele.webp?rlkey=oj41ihs5fv11ophgfg8987qng&st=qsysfkax&dl=0',
    'sin-bandera': 'https://www.dropbox.com/scl/fi/emn9jpa94uk4xjvkcqedo/sinbandera.webp?rlkey=89su40o8llasazrky62bdu6tk&st=yodd64tm&dl=0',
    'soda-stereo': 'https://www.dropbox.com/scl/fi/6lr82wvhscumks86baqqe/soda.webp?rlkey=iygko08qrvkqv031qrov4dro6&st=x2c3vl1c&dl=0',
    'queen': 'https://www.dropbox.com/scl/fi/bo65k181x59yy0j5nh0eh/queen.webp?rlkey=o01s2cdc8n3xez5xh7xpq3s50&st=311p06ei&dl=0',
    'bon-jovi': 'https://www.dropbox.com/scl/fi/moqlhrw4qubltvhnoji3e/bon-jovi.webp?rlkey=akcpc16trm2d372fb3vhjp1xr&st=vz7yq5ch&dl=0',
    'mana': 'https://www.dropbox.com/scl/fi/h15ixzh9zml5z19lqu5l4/mana.webp?rlkey=ztx3r093a2gzoht9c0x6qnsbx&st=qdj54rwn&dl=0',
    'enanitos-verdes': 'https://www.dropbox.com/scl/fi/gsryq67rtzgi0ykciyskr/enanitosverdes.webp?rlkey=bih2585n0ebqu7rmwx1eylvu9&st=bfv67tug&dl=0',
    'vicente-fernandez': 'https://www.dropbox.com/scl/fi/yn4s92q8j8gbustrvokrd/vicente.webp?rlkey=pe725amxv0fzaawejd5wap21j&st=75vpkn9e&dl=0',
    'juan-gabriel': 'https://www.dropbox.com/scl/fi/tmq9z0kf28xjpuwvlt27i/juagabriel.webp?rlkey=lslqqkf0vqqjqbo1eafdz8elc&st=ghd0ee1a&dl=0',
    'pepe-aguilar': 'https://www.dropbox.com/scl/fi/jhbhkgq52azgo83cf56uy/pepeaguilar.webp?rlkey=s0eym9mej2nnzssm2i8uwhrrv&st=bcoaqa3i&dl=0',
    'jenni-rivera': 'https://www.dropbox.com/scl/fi/2kuozv7x22ppc3jhwrkj4/jennirivera.webp?rlkey=mi3vm3gmk6zebu1kb4uypdy04&st=k88jq26x&dl=0',
    'christian-nodal': 'https://www.dropbox.com/scl/fi/z1i8zvaccz6x2k1z02xg5/critiannodal.webp?rlkey=g0fxoju3ryogvjle3qy9dwred&st=nltgcwxq&dl=0',
    'marc-anthony': 'https://www.dropbox.com/scl/fi/nz06xyq8wguv86wgzv93e/marcantonhy.webp?rlkey=m2xw235heek35xankrusixlgf&st=ndvaajmb&dl=0',
    'romeo-santos': 'https://www.dropbox.com/scl/fi/hqrti76ygsec64o2joest/romeosantos.webp?rlkey=w11x1jf7fr1yo5wem48jnvpws&st=vay0s7jl&dl=0',
    'aventura': 'https://www.dropbox.com/scl/fi/6clzpt1byjj5qvz2ctp0m/aventura.webp?rlkey=yfvcermddei2xjhun4w8etwle&st=juqoe722&dl=0',
    'los-kjarkas': 'https://www.dropbox.com/scl/fi/p8atu5fdwbnz5gv8x02wy/kjarkas.webp?rlkey=bwu1xg921ab49x46ol2sf5sfq&st=9pxb8hk2&dl=0',
    'savia-andina': 'https://www.dropbox.com/scl/fi/n1f2agj4qjs6yscuvz4nl/saviaandina.webp?rlkey=twkstpatl0hiksd0rx0q4t1nk&st=bobalxqz&dl=0',
    'grupo-tupay': 'https://www.dropbox.com/scl/fi/f9t5phvjvu59gxar17pro/tupay.webp?rlkey=fzs84k8tis6glnreys3gkg2fv&st=0q25g8pu&dl=0',
    'bonanza': 'https://www.dropbox.com/scl/fi/5zvouxar4s0m04cayqdjd/bonanza.webp?rlkey=lly2t6g1loi6isop8lrni21ni&st=qh3ol6dn&dl=0',
    'llajtaymanta': 'https://www.dropbox.com/scl/fi/lmj854daytx3yjvd0mhtf/llajtaymanta.webp?rlkey=zef044ogzhx0ug6tc63sz57nj&st=sk4d1ba6&dl=0',
  };
  const artistImage = id => {
    let url = ARTIST_IMAGES[id] || '';
    if (/dropbox\.com/i.test(url)) {
      url = url.replace(/[?&](?:dl|raw)=[^&]*/gi, '');
      url += (url.includes('?') ? '&' : '?') + 'raw=1';
    }
    return url;
  };
  const A = (name, genre, cats, subs, c1, c2, desc) => {
    const id = slug(name);
    return { id, name, genre, cats, subs, c1, c2, desc, img: artistImage(id) };
  };
  KT.ARTISTS = [
    A('Cristian Castro', 'Balada romántica', ['baladas', 'clasicos'], ['Románticas', 'Años 90'], '#5a1d1d', '#140808', 'Cantante mexicano de baladas románticas, infaltable en cualquier noche de karaoke.'),
    A('Taylor Swift', 'Pop internacional', ['pop'], ['Pop internacional'], '#6b3a5e', '#150a12', 'Cantautora estadounidense de pop, con coros ideales para cantar en grupo.'),
    A('Shawn Mendes', 'Pop internacional', ['pop'], ['Pop internacional'], '#3b3f5c', '#0b0c14', 'Cantautor canadiense de pop, con temas cómodos para voces suaves.'),
    A('Morat', 'Pop latino', ['pop'], ['Pop latino'], '#5c1f2b', '#12060a', 'Banda colombiana de pop latino con letras románticas fáciles de corear.'),
    A('Reik', 'Pop romántico', ['pop', 'baladas'], ['Pop latino', 'Románticas'], '#3d2b55', '#0d0814', 'Grupo mexicano de pop romántico, ideal para cantar entre amigos.'),
    A('Humbe', 'Pop latino', ['pop'], ['Pop latino'], '#2d4a55', '#08141a', 'Cantautor de pop latino con temas para corear en grupo.'),
    A('Luis Miguel', 'Baladas clásicas', ['baladas', 'clasicos'], ['Clásicas', 'Años 90'], '#5a4519', '#140f05', 'Voz clásica de la balada en español, un favorito para las canciones de siempre.'),
    A('Shakira', 'Pop latino', ['pop', 'latino'], ['Pop latino'], '#6b4a1e', '#150e05', 'Artista colombiana de pop latino con éxitos para bailar y cantar.'),
    A('Karol G', 'Reguetón', ['latino'], ['Reguetón'], '#58245c', '#120614', 'Artista colombiana de reguetón y música urbana para las salas más animadas.'),
    A('Bruno Mars', 'Pop internacional', ['pop'], ['Pop internacional'], '#5c3d1f', '#140d06', 'Cantante estadounidense de pop y funk, perfecto para un cierre con baile.'),
    A('Adele', 'Baladas', ['baladas', 'pop'], ['Despecho', 'Pop internacional'], '#2c4a5c', '#081218', 'Cantante británica de baladas potentes, para quienes quieren lucirse.'),
    A('Sin Bandera', 'Balada romántica', ['baladas'], ['Románticas'], '#4a2d5c', '#0f0814', 'Dúo de baladas románticas en español, clásico de los karaokes.'),
    A('Soda Stereo', 'Rock en español', ['rock', 'clasicos'], ['Rock en español', 'Años 80'], '#3d435c', '#0a0c14', 'Banda argentina referente del rock en español.'),
    A('Queen', 'Rock clásico', ['rock', 'clasicos'], ['Rock internacional', 'Años 80'], '#62501d', '#151005', 'Banda británica de rock con himnos para cantar en grupo.'),
    A('Bon Jovi', 'Rock internacional', ['rock', 'clasicos'], ['Rock internacional', 'Años 80'], '#5b3434', '#140909', 'Banda estadounidense conocida por sus clásicos de rock.'),
    A('Maná', 'Rock en español', ['rock'], ['Rock en español'], '#315145', '#08120e', 'Banda mexicana de rock en español.'),
    A('Enanitos Verdes', 'Rock en español', ['rock'], ['Rock en español'], '#3f5360', '#0a1014', 'Banda argentina de rock con canciones populares para karaoke.'),
    A('Vicente Fernández', 'Rancheras', ['regional', 'clasicos'], ['Rancheras', 'Regional mexicano', 'Clásicas'], '#5b4824', '#151005', 'Ícono mexicano de la música ranchera.'),
    A('Juan Gabriel', 'Balada y regional mexicano', ['regional', 'baladas', 'clasicos'], ['Regional mexicano', 'Románticas', 'Clásicas'], '#5d3457', '#140911', 'Cantautor mexicano de baladas y música ranchera.'),
    A('Pepe Aguilar', 'Regional mexicano', ['regional'], ['Rancheras', 'Regional mexicano'], '#5b3e25', '#140e08', 'Cantante mexicano de rancheras y música regional.'),
    A('Jenni Rivera', 'Regional mexicano', ['regional'], ['Regional mexicano', 'Rancheras'], '#5d3151', '#150911', 'Cantante mexicana de música regional y banda.'),
    A('Christian Nodal', 'Regional mexicano', ['regional'], ['Regional mexicano', 'Rancheras'], '#4a4940', '#11110d', 'Cantante mexicano de música regional y mariachi moderno.'),
    A('Marc Anthony', 'Salsa', ['latino'], ['Salsa'], '#514127', '#130f08', 'Cantante de salsa y música latina.'),
    A('Romeo Santos', 'Bachata', ['latino'], ['Bachata'], '#593246', '#140a10', 'Cantante de bachata y música latina.'),
    A('Aventura', 'Bachata', ['latino'], ['Bachata'], '#493658', '#100a14', 'Grupo de bachata conocido por sus canciones románticas.'),
    A('Los Kjarkas', 'Folclore boliviano', ['boliviana'], ['Folclore', 'Música nacional'], '#4c5637', '#10130b', 'Grupo boliviano referente del folclore andino.'),
    A('Savia Andina', 'Folclore boliviano', ['boliviana'], ['Folclore', 'Música nacional'], '#485b43', '#0d130d', 'Grupo boliviano de música folclórica andina.'),
    A('Grupo Tupay', 'Música boliviana', ['boliviana'], ['Folclore', 'Cumbia', 'Música nacional'], '#594532', '#140e08', 'Grupo boliviano de música nacional y folclórica.'),
    A('Bonanza', 'Folclore boliviano', ['boliviana'], ['Folclore', 'Música nacional'], '#4a5260', '#0d1015', 'Grupo boliviano de música folclórica y popular.'),
    A('Llajtaymanta', 'Música boliviana', ['boliviana'], ['Folclore', 'Cumbia', 'Música nacional'], '#5b3d2b', '#140d08', 'Grupo boliviano de música folklórica y ritmos nacionales.')
  ];

  // Canciones de ejemplo. Agrega las tuyas en este arreglo.
  const S = (title, artist, cats, subs) => ({ title, artist, cats, subs });
  KT.SONGS = [
    S('Azul', 'Cristian Castro', ['baladas'], ['Románticas']),
    S('Por amarte así', 'Cristian Castro', ['baladas', 'clasicos'], ['Románticas', 'Años 90']),
    S('Shake It Off', 'Taylor Swift', ['pop'], ['Pop internacional']),
    S('Love Story', 'Taylor Swift', ['pop'], ['Pop internacional']),
    S('Stitches', 'Shawn Mendes', ['pop'], ['Pop internacional']),
    S('Besos en guerra', 'Morat', ['pop'], ['Pop latino']),
    S('Creo en ti', 'Reik', ['baladas', 'pop'], ['Románticas', 'Pop latino']),
    S('Yo quisiera', 'Reik', ['baladas', 'pop'], ['Románticas', 'Pop latino']),
    S('Hips Don\'t Lie', 'Shakira', ['pop', 'latino'], ['Pop latino']),
    S('Waka Waka', 'Shakira', ['pop'], ['Pop latino']),
    S('Tusa', 'Karol G', ['latino', 'baladas'], ['Reguetón', 'Despecho']),
    S('Uptown Funk', 'Bruno Mars', ['pop'], ['Pop internacional']),
    S('Someone Like You', 'Adele', ['baladas'], ['Despecho']),
    S('Hello', 'Adele', ['baladas', 'pop'], ['Despecho', 'Pop internacional']),
    S('La incondicional', 'Luis Miguel', ['baladas', 'clasicos'], ['Clásicas', 'Años 90']),
    S('Entra en mi vida', 'Sin Bandera', ['baladas'], ['Románticas']),
    S('De música ligera', 'Soda Stereo', ['rock'], ['Rock en español']),
    S('Persiana americana', 'Soda Stereo', ['rock'], ['Rock en español']),
    S('Bohemian Rhapsody', 'Queen', ['rock'], ['Rock internacional']),
    S('Livin\' on a Prayer', 'Bon Jovi', ['rock', 'clasicos'], ['Rock internacional', 'Años 80']),
    S('Take On Me', 'a-ha', ['clasicos'], ['Años 80']),
    S('El rey', 'Vicente Fernández', ['regional'], ['Rancheras']),
    S('Cielito lindo', 'Tradicional', ['regional'], ['Mariachi']),
    S('Hasta que te conocí', 'Juan Gabriel', ['regional', 'baladas'], ['Regional mexicano', 'Despecho']),
    S('Valió la pena', 'Marc Anthony', ['latino'], ['Salsa']),
    S('Obsesión', 'Aventura', ['latino'], ['Bachata']),
    S('Gasolina', 'Daddy Yankee', ['latino', 'clasicos'], ['Reguetón', 'Años 2000']),
    S('Livin\' la vida loca', 'Ricky Martin', ['clasicos', 'pop'], ['Años 90', 'Pop latino']),
    S('Llorando se fue', 'Los Kjarkas', ['boliviana'], ['Folclore'])
  ];

  // Repertorio para que cada artista del catálogo tenga al menos 10 canciones.
  // Los temas nuevos heredan las categorías del artista para respetar los filtros.
  const SONG_CANDIDATES = {
    'Cristian Castro': ['Lloviendo estrellas', 'No podrás', 'Nunca voy a olvidarte', 'Volver a amar', 'Mi vida sin tu amor', 'Es mejor así', 'Después de ti... ¿qué?', 'Yo quería', 'Por amarte así', 'Azul', 'Gallito feliz', 'Mañana, mañana'],
    'Taylor Swift': ['You Belong with Me', 'Blank Space', 'Anti-Hero', 'Cruel Summer', 'Cardigan', 'Wildest Dreams', 'Enchanted', 'We Are Never Ever Getting Back Together', 'Lover', 'Style', 'Shake It Off', 'Love Story'],
    'Shawn Mendes': ['There’s Nothing Holdin’ Me Back', 'Treat You Better', 'In My Blood', 'Mercy', 'Señorita', 'If I Can’t Have You', 'Wonder', 'Lost in Japan', 'When You’re Gone', 'It’ll Be Okay', 'Stitches', 'Never Be Alone'],
    'Morat': ['Cómo te atreves', 'No se va', 'A dónde vamos', 'Cuando nadie ve', 'París', 'Amor con hielo', '506', 'Debí suponerlo', 'Salir con vida', 'Porfa no te vayas', 'Besos en guerra', 'Yo contigo, tú conmigo'],
    'Reik': ['Noviembre sin ti', 'Me niego', 'Ya me enteré', 'Inolvidable', 'Qué vida la mía', 'Sabes', 'Un año', 'Peligro', 'Voy a olvidarte', 'Fui', 'Creo en ti', 'Yo quisiera'],
    'Humbe': ['El poeta', 'Amor de cine', 'Fantasmas', 'Te lo prometo', 'Confieso', 'Himno', 'Patadas de ahogado', 'Kintsugi', 'Morfina', 'Sanvalentín', 'Fácil', 'REM'],
    'Luis Miguel': ['Ahora te puedes marchar', 'Culpable o no', 'Suave', 'Hasta que me olvides', 'Entrégate', 'La media vuelta', 'No sé tú', 'Por debajo de la mesa', 'Tengo todo excepto a ti', 'Cuando calienta el sol', 'La incondicional', 'Sabor a mí'],
    'Shakira': ['Antología', 'Ojos así', 'Whenever, Wherever', 'La tortura', 'Inevitable', 'Estoy aquí', 'Te felicito', 'Monotonía', 'Chantaje', 'Pies descalzos, sueños blancos', 'Hips Don’t Lie', 'Waka Waka'],
    'Karol G': ['Provenza', 'Bichota', 'Mi ex tenía razón', 'Mientras me curo del cora', 'El Makinón', 'TQG', 'Ocean', 'Amargura', 'Si antes te hubiera conocido', 'Cairo', 'Tusa', 'Mamiii'],
    'Bruno Mars': ['Just the Way You Are', 'Grenade', 'Locked Out of Heaven', '24K Magic', 'That’s What I Like', 'When I Was Your Man', 'Talking to the Moon', 'Treasure', 'The Lazy Song', 'Leave the Door Open', 'Marry You', 'Versace on the Floor'],
    'Adele': ['Rolling in the Deep', 'Set Fire to the Rain', 'Easy on Me', 'When We Were Young', 'Skyfall', 'Send My Love', 'Chasing Pavements', 'Make You Feel My Love', 'Love in the Dark', 'Water Under the Bridge', 'Hello', 'Someone Like You'],
    'Sin Bandera': ['Kilómetros', 'Que lloro', 'Mientes tan bien', 'Sirena', 'Te vi venir', 'Suelta mi mano', 'Que me alcance la vida', 'ABC', 'De viaje', 'En ésta no', 'Entra en mi vida', 'Te esperaré'],
    'Soda Stereo': ['Cuando pase el temblor', 'En la ciudad de la furia', 'Prófugos', 'Trátame suavemente', 'Nada personal', 'En el séptimo día', 'Sobredosis de TV', 'Signos', 'Juegos de seducción', 'Un millón de años luz', 'De música ligera', 'Persiana americana'],
    'Queen': ['We Will Rock You', 'Don’t Stop Me Now', 'Another One Bites the Dust', 'Somebody to Love', 'We Are the Champions', 'Killer Queen', 'Crazy Little Thing Called Love', 'Radio Ga Ga', 'I Want to Break Free', 'Under Pressure', 'Bohemian Rhapsody', 'Love of My Life'],
    'Bon Jovi': ['It’s My Life', 'Always', 'You Give Love a Bad Name', 'Wanted Dead or Alive', 'Bed of Roses', 'I’ll Be There for You', 'Keep the Faith', 'Runaway', 'Have a Nice Day', 'Bad Medicine', 'Livin’ on a Prayer', 'Never Say Goodbye'],
    'Maná': ['Rayando el sol', 'Oye mi amor', 'Clavado en un bar', 'Vivir sin aire', 'Labios compartidos', 'Mariposa traicionera', 'En el muelle de San Blas', 'Bendita tu luz', 'El reloj cucú', 'No ha parado de llover', 'Amor clandestino', 'Me vale'],
    'Enanitos Verdes': ['Lamento boliviano', 'La muralla verde', 'Luz de día', 'Por el resto', 'Igual que ayer', 'Eterna soledad', 'Mi primer día sin ti', 'Amores lejanos', 'Te vi en un tren', 'Tus viejas cartas', 'Guitarras blancas', 'La cordillera'],
    'Vicente Fernández': ['Volver volver', 'Mujeres divinas', 'Acá entre nos', 'Hermoso cariño', 'La ley del monte', 'Por tu maldito amor', 'Estos celos', 'De qué manera te olvido', 'A pesar de todo', 'Para siempre', 'El rey', 'La diferencia'],
    'Juan Gabriel': ['Querida', 'Amor eterno', 'Abrázame muy fuerte', 'Así fue', 'No tengo dinero', 'Se me olvidó otra vez', 'Noa Noa', 'La diferencia', 'Siempre en mi mente', 'Hasta que te conocí', 'Costumbres', 'Inocente pobre amigo'],
    'Pepe Aguilar': ['Por mujeres como tú', 'Prometiste', 'Miedo', 'Me vas a extrañar', 'Directo al corazón', 'Perdóname', 'Ni contigo ni sin ti', 'Mi credo', 'Por una mujer bonita', 'Recuérdame bonito', 'Almohada', 'Por amarte'],
    'Jenni Rivera': ['Inolvidable', 'Basta ya', 'La gran señora', 'Querida socia', 'Resulta', 'A cambio de qué', 'Paloma negra', 'De contrabando', 'No llega el olvido', 'Porque no le calas', 'La mentira', 'Ahora que estuviste lejos'],
    'Christian Nodal': ['Adiós amor', 'De los besos que te di', 'No te contaron mal', 'Probablemente', 'Botella tras botella', 'Ya no somos ni seremos', 'Aquí abajo', 'La intención', 'Dime cómo quieres', 'Te fallé', 'Nace un borracho', 'Vivo en el 6'],
    'Marc Anthony': ['Vivir mi vida', 'Flor pálida', 'Tu amor me hace bien', 'Ahora quién', 'Y hubo alguien', 'Parecen viernes', 'Qué precio tiene el cielo', 'Hasta ayer', 'Te conozco bien', 'Valió la pena', 'Contra la corriente', 'Nadie como ella'],
    'Romeo Santos': ['Propuesta indecente', 'Eres mía', 'Imitadora', 'Hilito', 'Necio', 'La diabla', 'You', 'Llévame contigo', 'Odio', 'Bella y sensual', 'Cancioncitas de amor', 'Sobredosis'],
    'Aventura': ['Ella y yo', 'Un beso', 'Dile al amor', 'Los infieles', 'Mi corazoncito', 'Amor de madre', 'El malo', 'Por un segundo', 'Su veneno', 'Cuándo volverás', 'Obsesión', 'La boda'],
    'Los Kjarkas': ['Imillitay', 'Ave de cristal', 'Negrita', 'Munasq’echay', 'Tiempo al tiempo', 'El árbol de mi destino', 'Saya sensual', 'T’una papita', 'Llorando se fue', 'Wayayay', 'La ventana', 'Al final'],
    'Savia Andina': ['Porque estás triste', 'A los bosques', 'Lamento indio', 'Leño verde', 'Rosa carmín', 'K’alanchito', 'El minero', 'Piel morena', 'Viva mi patria Bolivia', 'Cuerpo cobarde', 'A los bosques', 'Lamento de amor'],
    'Grupo Tupay': ['La Saya', 'Cholero', 'Nunca tuve suerte en el amor', 'Ay, amor', 'Ay, no sé qué tienes', 'América Latina', 'Mal acostumbrado', 'Soy caporal', 'Cholita', 'Saya Reina', 'Corazón de fiesta', 'Folklore de altura'],
    'Bonanza': ['No vuelvo a amar', 'Desde el fondo de mi alma', 'Flor de un día', 'Nostalgias', 'Morena', 'Mi viejo amor', 'Lágrimas de amor', 'Te olvidaré', 'Soledad', 'Amor de mi vida', 'Bolivia', 'Canto a mi tierra'],
    'Llajtaymanta': ['Cárcel de amor', 'Oruro te quiero más', 'La Brujita', 'Cien años más', 'Oruro de mis amores', 'Morenada Central', 'Viva mi patria Bolivia', 'Desde Oruro', 'Fiesta de mi pueblo', 'Mi viejo Oruro', 'Morenada de corazón', 'Caporales de mi tierra']
  };
  KT.ARTISTS.forEach(artist => {
    const existing = KT.SONGS.filter(song => song.artist === artist.name);
    const titles = new Set(existing.map(song => song.title.toLocaleLowerCase('es')));
    (SONG_CANDIDATES[artist.name] || []).forEach(title => {
      if (existing.length >= 10 || titles.has(title.toLocaleLowerCase('es'))) return;
      KT.SONGS.push({ title, artist: artist.name, cats: artist.cats.slice(), subs: artist.subs.slice() });
      existing.push({ title });
      titles.add(title.toLocaleLowerCase('es'));
    });
  });

  // Si el administrador guardó un repertorio propio, se conserva entre recargas y sin conexión.
  const savedAdminMusic = () => {
    try {
      const data = JSON.parse(localStorage.getItem('kt-admin-music') || 'null');
      return Array.isArray(data) ? data.filter(song => song && typeof song.title === 'string' && typeof song.artist === 'string').map(song => ({
        ...song, cats: Array.isArray(song.cats) ? song.cats : [], subs: Array.isArray(song.subs) ? song.subs : [], thumbnail: typeof song.thumbnail === 'string' ? song.thumbnail : ''
      })) : null;
    } catch (_) { return null; }
  };
  const savedSongs = savedAdminMusic();
  if (savedSongs) KT.SONGS = savedSongs;

  // Completa metadatos de pistas desde JSON sin bloquear el catálogo inicial.
  KT.loadAsyncTracks = function () {
    return fetch('./js/data/pistas.json')
      .then(response => {
        if (!response.ok) throw new Error('No se pudo cargar js/data/pistas.json');
        return response.json();
      })
      .then(tracks => {
        if (savedAdminMusic()) {
          KT.refresh();
          if (KT.renderAdmin) KT.renderAdmin();
          return tracks.length;
        }
        tracks.forEach(track => {
          const artist = KT.ARTISTS.find(item => item.name === track.artist);
          if (!artist || !track.title) return;
          const image = track.thumbnail || artist.img || 'js/assets/icons/track-placeholder.svg';
          const existing = KT.SONGS.find(song => song.artist === artist.name && norm(song.title) === norm(track.title));
          if (existing) {
            existing.thumbnail = image;
            existing.loadedFromJson = true;
          } else {
            KT.SONGS.push({
              title: track.title, artist: artist.name,
              cats: (track.cats || artist.cats).slice(),
              subs: (track.subs || artist.subs).slice(),
              thumbnail: image, loadedFromJson: true
            });
          }
        });
        KT.refresh();
        return tracks.length;
      })
      .catch(error => {
        console.warn('El catálogo continúa con los datos locales; no se cargó el JSON de pistas.', error);
        return 0;
      });
  };

  const st = KT.state = { cat: 'todos', sub: null, q: '', az: false, mode: 'artistas', page: 1 };

  const passes = (it, text) => {
    if (st.cat !== 'todos' && !it.cats.includes(st.cat)) return false;
    if (st.sub && !it.subs.includes(st.sub)) return false;
    return !st.q || norm(text).includes(norm(st.q));
  };
  KT.artists = () => {
    let r = KT.ARTISTS.filter(a => passes(a, a.name + ' ' + a.genre + ' ' + KT.SONGS.filter(s => s.artist === a.name).map(s => s.title).join(' ')));
    return st.az ? [...r].sort((a, b) => a.name.localeCompare(b.name, 'es')) : r;
  };
  KT.songs = () => {
    let r = KT.SONGS.filter(s => passes(s, s.title + ' ' + s.artist));
    return st.az ? [...r].sort((a, b) => a.title.localeCompare(b.title, 'es')) : r;
  };

  /* ---- Filtros (se repiten en Inicio y Catálogo) ---- */
  const subRow = () => {
    const cat = KT.CATS.find(c => c.id === st.cat);
    const html = cat.subs.map(s => `<button class="sub-chip${st.sub === s ? ' active' : ''}" data-sub="${s}">${s}</button>`).join('');
    $('.subs-in').html(html);
    $('.subs').toggleClass('open', cat.subs.length > 0);
  };
  KT.setCat = id => {
    st.cat = id; st.sub = null; st.page = 1;
    $('.chip').each(function () { $(this).toggleClass('active', $(this).data('cat') === id); });
    const categoryName = (KT.CATS.find(category => category.id === id) || KT.CATS[0]).name;
    $('.chip-menu-label').text(categoryName);
    $('.chips').removeClass('mobile-open').find('.chip-menu-toggle').attr('aria-expanded', 'false');
    subRow(); KT.refresh();
  };
  KT.initFilters = () => {
    const chips = KT.CATS.map(c => `<button class="chip${c.id === 'todos' ? ' active' : ''}" data-cat="${c.id}">${KT.ic(c.icon)}<span>${c.name}</span></button>`).join('');
    $('.js-filters').html(`<div class="chips"><button type="button" class="chip-menu-toggle" aria-expanded="false" aria-label="Abrir categorías"><span class="hamburger-lines" aria-hidden="true"><i></i><i></i><i></i></span><span class="chip-menu-label">Todos</span></button>${chips}</div>
      <div class="fbar"><label class="search">${KT.ic('search')}<input type="search" class="q" placeholder="Buscar artista o canción…" aria-label="Buscar artista o canción" autocomplete="off"></label>
      <button class="fbtn" aria-pressed="false" aria-label="Ordenar de la A a la Z" title="Ordenar de la A a la Z">${KT.ic('filter')}</button></div>
      <div class="subs"><div class="subs-w"><div class="subs-in"></div></div></div>`);
    const $layerCategory = $('#layerCategory');
    const $layerSubcategory = $('#layerSubcategory');
    const $layerArtist = $('#layerArtist');
    const $layerResults = $('#layerResults');
    const option = (value, label) => $('<option>').val(value).text(label);
    KT.CATS.filter(category => category.id !== 'todos').forEach(category => {
      $layerCategory.append(option(category.id, category.name));
    });

    // Filtro de tres capas: categoría → subgénero → artista; los resultados se renderizan como texto.
    $(document).off('change.ktCatalog', '#layerCategory').on('change.ktCatalog', '#layerCategory', function () {
      const category = KT.CATS.find(item => item.id === this.value);
      $layerSubcategory.empty().append(option('', category ? 'Selecciona un subgénero' : 'Primero elige una categoría'));
      $layerArtist.empty().append(option('', 'Primero elige un subgénero')).prop('disabled', true);
      $layerResults.empty().append($('<li>').text('Selecciona las tres capas para ver sus canciones.'));
      if (!category) { $layerSubcategory.prop('disabled', true); return; }
      category.subs.forEach(sub => $layerSubcategory.append(option(sub, sub)));
      $layerSubcategory.prop('disabled', false);
    });
    $(document).off('change.ktCatalog', '#layerSubcategory').on('change.ktCatalog', '#layerSubcategory', function () {
      const category = KT.CATS.find(item => item.id === $layerCategory.val());
      const sub = this.value;
      $layerArtist.empty().append(option('', sub ? 'Selecciona un artista' : 'Primero elige un subgénero'));
      $layerResults.empty().append($('<li>').text('Selecciona las tres capas para ver sus canciones.'));
      if (!category || !sub) { $layerArtist.prop('disabled', true); return; }
      const artists = KT.ARTISTS.filter(artist => artist.cats.includes(category.id) && artist.subs.includes(sub));
      artists.forEach(artist => $layerArtist.append(option(artist.id, artist.name)));
      $layerArtist.prop('disabled', !artists.length);
      if (!artists.length) {
        $layerArtist.find('option').first().text('No hay artistas registrados');
        $layerResults.empty().append($('<li>').text('Todavía no hay artistas registrados para este subgénero.'));
      }
    });
    $(document).off('change.ktCatalog', '#layerArtist').on('change.ktCatalog', '#layerArtist', function () {
      const category = KT.CATS.find(item => item.id === $layerCategory.val());
      const sub = $layerSubcategory.val();
      const artist = KT.ARTISTS.find(item => item.id === this.value);
      const tracks = artist && category && sub
        ? KT.SONGS.filter(song => song.artist === artist.name && song.cats.includes(category.id) && song.subs.includes(sub))
        : [];
      $layerResults.empty();
      if (!tracks.length) {
        $layerResults.append($('<li>').text(artist ? 'No hay canciones disponibles para esta selección.' : 'Selecciona las tres capas para ver sus canciones.'));
        return;
      }
      tracks.forEach(song => $layerResults.append($('<li>').text(`${song.title} · ${song.artist}`)));
    });
    $(document).off('click.ktCatalog', '#layerFilterToggle').on('click.ktCatalog', '#layerFilterToggle', function () {
      const open = $('#layerFilterPanel').prop('hidden');
      $('#layerFilterPanel').prop('hidden', !open);
      $(this).attr('aria-expanded', String(open));
    });
    $(document).off('click.ktCatalog', '.chip-menu-toggle').on('click.ktCatalog', '.chip-menu-toggle', function () {
      const $chips = $(this).closest('.chips');
      const open = !$chips.hasClass('mobile-open');
      $chips.toggleClass('mobile-open', open);
      $(this).attr({ 'aria-expanded': String(open), 'aria-label': open ? 'Cerrar categorías' : 'Abrir categorías' });
    });
    $(document).off('click.ktCatalog', '.chip').on('click.ktCatalog', '.chip', function () { KT.setCat($(this).data('cat')); });
    $(document).off('click.ktCatalog', '.sub-chip').on('click.ktCatalog', '.sub-chip', function () {
      const s = $(this).data('sub'); st.sub = st.sub === s ? null : s; st.page = 1;
      $('.sub-chip').each(function () { $(this).toggleClass('active', $(this).data('sub') === st.sub); });
      KT.refresh();
    });
    $(document).off('input.ktCatalog', '.q').on('input.ktCatalog', '.q', function () { st.q = this.value.trim(); st.page = 1; $('.q').not(this).val(this.value); KT.refresh(); });
    $(document).off('click.ktCatalog', '.fbtn').on('click.ktCatalog', '.fbtn', function () {
      st.az = !st.az; st.page = 1; $('.fbtn').attr('aria-pressed', st.az);
      KT.toast(st.az ? 'Orden de la A a la Z' : 'Orden por destacados'); KT.refresh();
    });
  };

  /* ---- Tarjetas de artistas ---- */
  // loading="lazy" hace que cada foto se cargue cuando está cerca de aparecer en pantalla.
  const card = (a, i) => `<article class="artist-card" tabindex="0" data-id="${a.id}" style="--i:${i}" aria-label="${a.name}, ${a.genre}">
    <div class="artist-card__image" style="--c1:${a.c1};--c2:${a.c2}"><span class="artist-card__initials">${initials(a.name)}</span>${a.img ? `<img src="${a.img}" alt="Foto de ${a.name}" width="400" height="500" loading="lazy" decoding="async" data-remove-on-error>` : ''}</div>
    <button class="artist-card__zoom" type="button" aria-label="Ampliar foto de ${a.name}">${KT.ic('zoom')}</button>
    <div class="artist-card__meta"><b class="artist-card__name">${a.name}</b><small class="artist-card__genre">${a.genre}</small></div></article>`;
  const empty = t => `<p class="empty">${t}</p>`;
  // Valida el esquema de las miniaturas del JSON y devuelve una imagen local si el enlace no es seguro.
  const safeImageSource = value => {
    const fallback = 'js/assets/icons/track-placeholder.svg';
    try {
      const url = new URL(value || fallback, window.location.href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : fallback;
    } catch (_) { return fallback; }
  };

  KT.renderTrack = () => {
    const l = KT.artists();
    // Inicio: seis columnas por dos filas en escritorio; el resto sigue en Catálogo > Artistas.
    const featured = l.slice(0, 12);
    $('#homeTrack').html(featured.length ? featured.map(card).join('') : empty('No hay artistas con este filtro. Prueba otra categoría o borra la búsqueda.'));
    $('#homeTrack').scrollLeft(0);
  };
  $(document).off('click.ktCatalog', '.artist-card').on('click.ktCatalog', '.artist-card', function (e) {
    const touch = matchMedia('(hover:none)').matches;
    if (touch && !$(this).hasClass('artist-card--active') && !$(e.target).closest('.artist-card__zoom').length) {
      $('.artist-card--active').removeClass('artist-card--active'); $(this).addClass('artist-card--active'); return; // primer toque: zoom
    }
    KT.openArtist($(this).data('id'));
  });
  $(document).off('keydown.ktCatalog', '.artist-card').on('keydown.ktCatalog', '.artist-card', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); KT.openArtist($(this).data('id')); } });

  /* ---- Vista Catálogo ---- */
  KT.setMode = m => {
    st.mode = m; st.page = 1;
    $('.tab').each(function () {
      const selected = $(this).data('tab') === m;
      $(this).toggleClass('active', selected).attr('aria-selected', String(selected));
      if (selected) $('#catBody').attr('aria-labelledby', this.id);
    });
    KT.renderCatalog();
  };
  KT.renderCatalog = () => {
    const $b = $('#catBody'), $p = $('#pager');
    const laptopCatalog = matchMedia('(min-width:1024px) and (max-width:1599px)').matches;
    const laptopSongs = st.mode === 'canciones' && laptopCatalog;
    $('#view-catalogo').toggleClass('laptop-songs', laptopSongs);
    $('#view-catalogo').removeClass('laptop-songs-full');
    if (st.mode === 'generos') {
      $b.html('<div class="genres">' + KT.CATS.filter(c => c.id !== 'todos').map((c, i) =>
        `<button class="gtile" style="--i:${i}" data-genre="${c.id}">${KT.ic(c.icon)}<b>${c.name}</b><small>${KT.SONGS.filter(s => s.cats.includes(c.id)).length} canciones de ejemplo</small><small>${c.subs.join(', ')}</small></button>`).join('') + '</div>');
      $p.empty(); return;
    }
    const list = st.mode === 'artistas' ? KT.artists() : KT.songs();
    const small = matchMedia('(max-width:767px)').matches;
    let size = st.mode === 'artistas' ? (small ? 6 : 8) : (innerHeight < 720 ? 4 : 6);
    if (st.mode === 'artistas' && laptopCatalog) {
      // En laptop se calculan las tarjetas que caben en las columnas y filas visibles,
      // para evitar una segunda fila incompleta y el hueco grande debajo del catálogo.
      const columns = Math.max(1, Math.floor(($b.innerWidth() + 12) / 192));
      const cardHeight = (($b.innerWidth() - (columns - 1) * 12) / columns) * 4 / 3;
      const controlsHeight = $('.tabs').outerHeight(true) + $('.js-filters').outerHeight(true) +
        $('#layerFilterToggle').outerHeight(true) + $('#layerFilterPanel').outerHeight(true);
      const pagerHeight = 52;
      const availableHeight = $('#view-catalogo').innerHeight() - controlsHeight - pagerHeight - 70;
      const rows = Math.max(1, Math.floor((availableHeight + 12) / (cardHeight + 12)));
      size = columns * rows;
    }
    if (laptopSongs) {
      const columns = Math.max(1, Math.floor(($b.innerWidth() + 10) / 310));
      const controlsHeight = $('.tabs').outerHeight(true) + $('.js-filters').outerHeight(true) +
        $('#layerFilterToggle').outerHeight(true) + $('#layerFilterPanel').outerHeight(true);
      const pagerHeight = $p.is(':empty') ? 40 : $p.outerHeight(true);
      const gapsAndPadding = 52;
      const availableHeight = $('#view-catalogo').innerHeight() - controlsHeight - pagerHeight - gapsAndPadding;
      const rows = Math.max(1, Math.floor((availableHeight + 10) / 82));
      size = columns * rows;
    }
    const pages = Math.max(1, Math.ceil(list.length / size));
    st.page = Math.min(st.page, pages);
    const slice = list.slice((st.page - 1) * size, st.page * size);
    $('#view-catalogo').toggleClass('laptop-songs-full', laptopSongs && slice.length === size);
    if (!slice.length) { $b.html(empty(st.mode === 'artistas' ? 'No hay artistas con este filtro todavía.' : 'No hay canciones con este filtro todavía.')); $p.empty(); return; }
    if (st.mode === 'artistas') {
      $b.html(`<div class="agrid">${slice.map(card).join('')}</div>`);
    } else {
      // XSS: el JSON puede cambiar; título, artista y género se insertan con .text(), nunca como HTML.
      const $songs = $('<ul>').addClass('songs');
      slice.forEach((s, i) => {
        const artist = KT.ARTISTS.find(item => item.name === s.artist);
        const thumbnail = safeImageSource(s.thumbnail || (artist && artist.img));
        const $img = $('<img>').addClass('songs__thumbnail').attr({
          src: thumbnail, alt: `Miniatura de ${String(s.artist || 'artista')}`,
          width: 44, height: 44, loading: 'lazy', decoding: 'async'
        }).on('error.ktCatalog', function () {
          $(this).off('error.ktCatalog').attr('src', 'js/assets/icons/track-placeholder.svg');
        });
        const $details = $('<div>').addClass('songs__details').append(
          $('<b>').addClass('songs__title').text(String(s.title || '')),
          $('<small>').addClass('songs__artist').text(String(s.artist || ''))
        );
        const $tag = $('<span>').addClass('tag songs__category').text(Array.isArray(s.subs) ? String(s.subs[0] || '') : '');
        $songs.append($('<li>').addClass('songs__item').css('--i', i).append($img, $details, $tag));
      });
      $b.empty().append($songs);
    }
    if (pages === 1) { $p.empty(); return; }
    const mobilePager = matchMedia('(max-width:767px)').matches;
    let h = `<button data-page="${st.page - 1}" aria-label="Página anterior" ${st.page === 1 ? 'disabled' : ''}>${KT.ic('left')}</button>`;
    const firstPage = mobilePager ? Math.max(1, Math.min(st.page - 1, pages - 2)) : 1;
    const lastPage = mobilePager ? Math.min(pages, firstPage + 2) : pages;
    for (let i = firstPage; i <= lastPage; i++) h += `<button data-page="${i}" class="${i === st.page ? 'active' : ''}" aria-label="Página ${i}">${i}</button>`;
    h += `<button data-page="${st.page + 1}" aria-label="Página siguiente" ${st.page === pages ? 'disabled' : ''}>${KT.ic('right')}</button>`;
    $p.html(h);
  };
  $(document).off('click.ktCatalog', '#pager button:not(:disabled)').on('click.ktCatalog', '#pager button:not(:disabled)', function () { st.page = +$(this).data('page'); KT.renderCatalog(); });
  $(document).off('click.ktCatalog', '.tab').on('click.ktCatalog', '.tab', function () { KT.setMode($(this).data('tab')); });
  $(document).off('click.ktCatalog', '.gtile').on('click.ktCatalog', '.gtile', function () { KT.setCat($(this).data('genre')); KT.setMode('canciones'); });

  KT.refresh = () => { KT.renderTrack(); KT.renderCatalog(); };
})(jQuery);



