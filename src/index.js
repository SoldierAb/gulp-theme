let isDefault = true;

function changeSkin(){
    isDefault = !isDefault;
    const linkTag = document.getElementById('theme');
    linkTag.href=`/dist/style/${isDefault?'default':'light'}.css`
}

const btn = document.createElement('button');
btn.innerText="toggle skin";
btn.onclick = changeSkin;
document.body.append(btn)