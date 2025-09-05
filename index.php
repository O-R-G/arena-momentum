<?php
// Simple routing for /about, /schedule, and /colophon
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove leading slash and get the first segment
$segments = explode('/', trim($path, '/'));
$route = $segments[0] ?? '';

// Also check for route parameter (for fallback files)
if (isset($_GET['route'])) {
    $route = $_GET['route'];
}

// Define valid routes
$valid_routes = ['about', 'schedule', 'colophon'];
$active_overlay = '';

if (in_array($route, $valid_routes)) {
    $active_overlay = $route;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>M O M E N T U M</title>
  <link rel="stylesheet" href="static/css/main.css">
  <link rel="stylesheet" href="static/css/hershey.css">
</head>
<body>
  <div id="channel-info"></div>

  <div id="overlay">
    <div id="about" <?php echo $active_overlay === 'about' ? 'style="display: block; opacity: 1;"' : ''; ?>>
      <div>
        An artwork has the choice of two fates. One is to live in cold storage, a safe zone, fully insured. It has travel companions and guardians and is rarely on view for a public encounter — and rarely encounters other works of art. The second claims a life of activity, travels the world in its own shipping container, enjoys cultural diversity, locals, and international guests, and collects a patina of time and use.<br><br>
      </div>

      <div>
        Arena was designed for an itinerant life: it comes apart easily, packs up easily, unpacks easily, installs and deinstalls quickly. Its cycle is about fluidity and flexibility. Its 4 × 4 meter modular components are interchangeable, which allows different parts of Arena to be in many places at once, if so desired.<br><br>
      </div>

      <div>
        Arena becomes an arena when animated by people in an ongoing and open process that is punctuated by choreographed engagements. For the duration of the presentation at <a href="https://www.diaart.org/exhibition/exhibitions-projects/rita-mcbride-arena-momentum-exhibition" target="new">Dia Beacon</a>, an expanding body of artists, performers, writers, musicians, and dancers activated physical and virtual spaces as part of a series of engagements with Arena. The series, collectively called Momentum, was initiated by <a href="https://www.ritamcbride.net" target="new">Rita McBride</a> with experimental performance collective <a href="http://www.discotecaflamingstar.com" target="new">discoteca flaming star</a> (founded by Cristina Gomez Barrio and Wolfgang Mayer) and artist and choreographer <a href="https://alexandrawaierstall.com" target="new">Alexandra Waierstall</a>.<br><br>
      </div>

      <div>
        Momentum was active at Dia Beacon on the following dates: <a href="https://www.diaart.org/program/past-programs/momentum-manifesto-rita-mcbride-and-david-reinfurt-dia-talks-09092023/year/2023" target="new">September 9, 2023</a>, <a href="https://www.diaart.org/program/past-programs/momentum-performance-10132023/year/2023" target="new">October 13–15, 2023</a>, <a href="https://www.diaart.org/program/past-programs/momentum-performance-02242024/year/2024" target="new">February 24, 2024</a>, <a href="https://www.diaart.org/program/past-programs/momentum-performance-05102024/year/2024" target="new">May 10 & 12, 2024</a>, <a href="https://www.diaart.org/program/past-programs/momentum-performance-10252024/year/2024" target="new">October 25–27, 2024</a>.<br><br>
      </div>

      <div>
        This website collects documents from these events, hosted on a series of <a href="https://are.na" target="new">** Are.na</a> channels, and runs on a schedule generated daily. The schedule ensures that every visitor to the website views the same material at the same time.<br><br>
      </div>

      <div>
        <span class="popup"><a href="javascript:overlay_show('schedule');">Schedule</a></span>&nbsp;&nbsp;
        <span class="popup"><a href="javascript:overlay_show('colophon');">Colophon</a></span><br><br>
      </div>

      <div>
        Complete Arena digital fabrication files are available to download under a Copyleft license below.
      </div>

    </div>

    <div id="schedule" <?php echo $active_overlay === 'schedule' ? 'style="display: block; opacity: 1;"' : ''; ?>>
      <div id="schedule-grid" style="opacity: 1; color: white;"></div>
      <div class="x no-underline">
        <a href="javascript:overlay_hide('schedule');">
          <img src="/static/media/svg/x-1-w.svg">
        </a>
      </div>
    </div>

    <div id="colophon" <?php echo $active_overlay === 'colophon' ? 'style="display: block; opacity: 1;"' : ''; ?>>
      <div class="content">
        <div class="no-break">
          <a href="https://www.diaart.org/exhibition/exhibitions-projects/rita-mcbride-arena-momentum-exhibition" target="new">Rita McBride: Arena Momentum</a><br>
          July 1, 2023–January 6, 2025<br>
          Dia Beacon<br>
          <br>
        </div>

        <div class="no-break">
          Exhibition<br>
          Alexis Lowry, curator<br>
          Matilde Guidelli Guidi, curator<br>
          Emily Markert, assistant curator<br>
          <br>
        </div>

        <div class="no-break">
          Performances<br>
          Momentum (Rita McBride, Alexandra Waierstall, discoteca flaming star)<br>
          <br>
        </div>

        <div class="no-break">
          Poster<br>
          David Reinfurt, design<br>
          <br>
        </div>

        <div class="no-break">
          Website<br>
          David Reinfurt, design<br>
          Charles Broskoski, programming<br>
          <br>
        </div>
      </div>

      <div class="x no-underline">
        <a href="javascript:overlay_hide('colophon');">
          <img src="/static/media/svg/x-1-w.svg">
        </a>
      </div>
    </div>

    <div id="copyleft-download">
      <a href="https://en.wikipedia.org/wiki/Copyleft" target="new" class="no-underline">
        <img src="/static/media/svg/copyleft.svg">
      </a>
      <a href="https://diaart.wufoo.com/forms/rita-mcbride-arena/" target="_blank" class="no-underline">
        <img src="/static/media/svg/arrow-down-1-k.svg">
      </a>
      <a id="download-link" href="https://diaart.wufoo.com/forms/rita-mcbride-arena/" target="_blank">Download Arena files ... </a>
    </div>
  </div>

  <canvas id="canvas" width="200" height="200"></canvas>
  <script type="module" src="static/js/main.js"></script>
  
  <?php if ($active_overlay): ?>
  <script>
    // Pre-show the appropriate overlay when the page loads
    document.addEventListener('DOMContentLoaded', function() {
      if (window.app && window.app.overlay) {
        // Set the overlay to be visible and show the specific section
        window.app.overlay.setVisibility(true);
        window.app.overlay.show('<?php echo $active_overlay; ?>');
        
        // Pause and flip the logo animation for direct routes
        if (window.app.animation) {
          window.app.animation.isPaused = true;
          window.app.animation.isFlipped = true;
        }
        
        // For schedule route, ensure the grid is created after slideshow loads
        if ('<?php echo $active_overlay; ?>' === 'schedule') {
          // Wait for slideshow to be ready, then create schedule grid
          const checkSlideshow = () => {
            if (window.slideshow && window.slideshow.schedule) {
              window.slideshow.createScheduleGrid();
              // Don't pause slideshow - let it continue running on schedule
            } else {
              // Check again in 100ms
              setTimeout(checkSlideshow, 100);
            }
          };
          checkSlideshow();
        }
        // Note: slideshow continues running in background for all routes
      }
    });
  </script>
  <?php endif; ?>
</body>
</html>
