let itemCounter = 2

const addButton = document.getElementById("Add").addEventListener('click', function() {
    const list = document.getElementById("Elements-list");
    const originalBox = list.querySelector('.box');
    const User_name = prompt("Как зовут Участника?")
    if (originalBox) {
        const clonedBox = originalBox.cloneNode(true);
        clonedBox.id = `item-${itemCounter}`;
        clonedBox.innerHTML = `<button id="Duck"> Утка сраная</button> <p class="User_name">${User_name}</p><button id="Min">-</button>`
        list.appendChild(clonedBox);
        itemCounter++;
    } else {
        const newBox = document.createElement('div');
        itemCounter = 1
        newBox.id = `item-${itemCounter}`;
        newBox.className = 'box';
        newBox.innerHTML = `<button id="Duck"> Утка сраная</button> ${User_name}<button id="Min">-</button>`
        list.appendChild(newBox);
        itemCounter++;
    }
});

document.getElementById("Elements-list").addEventListener('click', function() {
    if (event.target && event.target.id == 'Min') {
        const boxToRemove = event.target.closest('.box');
        if (boxToRemove) {
            boxToRemove.remove();
        }
    }
})
 
