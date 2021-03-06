// "use strict";

/* Editor Stuff */
var filename = "scratch";


marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false, // IMPORTANT, because we do MathJax before markdown,
                   //            however we do escaping in 'CreatePreview'.
  smartLists: true,
  smartypants: false
});

var update = _.debounce(function(){
    $buf = $("#output-buffer");
    $buf.html(editor.exportFile(null, 'text'));
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, $buf[0]]);
    $("#output").html(marked($buf.html()));

}, 500, { 'leading': true, 'trailing': true });

let editor = new EpicEditor({
        container: $("#input")[0],
        basePath: "epiceditor-0.2.2",
        clientSideStorage: false,
        button: false
    })
    .load()
    .on("update", update);

function reset(){
    var proforma = $("#proforma").val();
    editor.importFile(null, proforma);
}

/* Store Stuff */
loadHash();

function loadHash(){
    if (window.location.hash !== '') {
        let sid = window.location.hash.slice(1);
        $.getJSON('/api/load/' + sid).done((data) =>
            editor.importFile(null, data.snippetContent))
    } else {
        reset();
    }
}

let clipboard = new Clipboard('#copy', { text: () => window.location.href })
    .on('success', function(e) {
        $(e.trigger).tooltip('show');
        setTimeout(() => {
            $(e.trigger).tooltip('hide');
        }, 1000);
    });

$('[data-toggle="tooltip"]').tooltip();

$(window).on('popstate', function(ev){
    loadHash();
});

$('#save').on('click', (ev) => {
    // show tooltip
    let $btn = $(ev.target);
    $btn.button('loading');

    // post to get hash, and set it as History
    let data = {'snippetContent': editor.exportFile()};
    $.ajax({
        url: '/api/save',
        type: 'POST',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
    }).done((sid) => {
        window.location.hash = sid.snippetId;

        $btn.tooltip('show');
        setTimeout(() => {
            $btn.tooltip('hide');
        }, 1000);
    }).fail((err) => {
        console.log(err);
    }).always(() => $btn.button('reset'));
});
