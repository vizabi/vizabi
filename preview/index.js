import './assets/css/main.scss';

import 'font-awesome/css/font-awesome.min.css';

import 'font-awesome/fonts/FontAwesome.otf';
import 'font-awesome/fonts/fontawesome-webfont.eot';
import 'font-awesome/fonts/fontawesome-webfont.svg';
import 'font-awesome/fonts/fontawesome-webfont.ttf';
import 'font-awesome/fonts/fontawesome-webfont.woff';
import 'font-awesome/fonts/fontawesome-webfont.woff2';

import 'vizabi-ddfcsv-reader/dist/bundle.web';
import 'vizabi-ws-reader/dist/bundle.web';
import 'd3/d3';

const _require = require.context('./', false, /\.pug$/);
_require.keys().forEach(_require);
