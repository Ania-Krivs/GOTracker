let itemCounter = 2
const addButton = document.getElementById("Add").addEventListener('click', function() {
    const list = document.getElementById("Elements-list");
    const originalBox = list.querySelector('.box');
    if (originalBox) {
        const clonedBox = originalBox.cloneNode(true);
        clonedBox.id = `item-${itemCounter}`;
        list.appendChild(clonedBox);
        itemCounter++;
    } else {
        const newBox = document.createElement('div');
        newBox.id = `item-${itemCounter}`;  
        // для 1
        // newBox.id = `item-${itemCounter}`;
        // itemCounter = 2
        newBox.className = 'box';
        newBox.innerHTML = '<button id="Duck"> Утка сраная</button><button id="Min">-</button>'
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