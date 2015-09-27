(function () {

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

    Vizabi.Helper.extend("gapminder-mountainchart-math", {

        init: function (context) {
            this.context = context;
        },

        
        gdpToMu: function(gdp, sigma, gdpFactor, gdpShift){
            // converting gdp per capita per day into MU for lognormal distribution
            // see https://en.wikipedia.org/wiki/Log-normal_distribution
            return Math.log(gdp/365) - sigma*sigma/2;
        },
        
        giniToSigma: function (gini) {
            //The ginis are turned into std deviation. Mattias uses this formula in Excel: stddev = NORMSINV( ((gini/100)+1)/2 )*2^0.5
            return this.normsinv( ( (gini / 100) + 1 ) / 2 ) * Math.pow(2,0.5);
        },
        
                         
        // this function returns PDF values for a specified distribution
        pdf: {
            normal: function(x, mu, sigma){
                return Math.exp(
                    - 0.5 * Math.log(2 * Math.PI)
                    - Math.log(sigma)
                    - Math.pow(x - mu, 2) / (2 * sigma * sigma)
                    );
            },
            lognormal: function(x, mu, sigma){
                return Math.exp(
                    - 0.5 * Math.log(2 * Math.PI) //should not be different for the two scales- (scaleType=="linear"?Math.log(x):0)
                    - Math.log(sigma)
                    - Math.pow(Math.log(x) - mu, 2) / (2 * sigma * sigma)
                );
            }
        },

        
        normsinv: function (p) {
            //
            // Lower tail quantile for standard normal distribution function.
            //
            // This function returns an approximation of the inverse cumulative
            // standard normal distribution function.  I.e., given P, it returns
            // an approximation to the X satisfying P = Pr{Z <= X} where Z is a
            // random variable from the standard normal distribution.
            //
            // The algorithm uses a minimax approximation by rational functions
            // and the result has a relative error whose absolute value is less
            // than 1.15e-9.
            //
            // Author:      Peter John Acklam
            // (Javascript version by Alankar Misra @ Digital Sutras (alankar@digitalsutras.com))
            // Time-stamp:  2003-05-05 05:15:14
            // E-mail:      pjacklam@online.no
            // WWW URL:     http://home.online.no/~pjacklam
            
            // Taken from http://home.online.no/~pjacklam/notes/invnorm/index.html
            // adapted from Java code
            
            // An algorithm with a relative error less than 1.15*10-9 in the entire region.

            // Coefficients in rational approximations
            var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
            var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
            var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
            var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

            // Define break-points.
            var plow = 0.02425;
            var phigh = 1 - plow;

            // Rational approximation for lower region:
            if (p < plow) {
                var q = Math.sqrt(-2 * Math.log(p));
                return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
            }

            // Rational approximation for upper region:
            if (phigh < p) {
                var q = Math.sqrt(-2 * Math.log(1 - p));
                return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
            }

            // Rational approximation for central region:
            var q = p - 0.5;
            var r = q * q;
            return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
                (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);

        }



    });


}).call(this);