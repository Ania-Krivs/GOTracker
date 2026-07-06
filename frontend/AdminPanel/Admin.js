let itemCounter = 2
let swit = 0
let User_code = "#123456"
let UserNameValue = ""
const addButton = document.getElementById("Add").addEventListener('click', function(event) {

    const newAllert = document.createElement('div');
    newAllert.id = `Error_window`;
    newAllert.className = 'Error_allerts';
    newAllert.innerHTML = `
    <p id="User_name_txt"> Введите имя пользователя</p>
    <input type="text" class="User_names" name="User_names">
    <button id="Create_user"> Добавить</button>`;
    document.querySelector(".Error_allerts").appendChild(newAllert);
});

document.getElementById("Elements-list").addEventListener('click', function(event) {
    if (event.target && event.target.id == 'Min') {
        const boxToRemove = event.target.closest('.box');
        if (boxToRemove) {
            boxToRemove.remove();
        }
    }
})
 
document.addEventListener('click', function(event) { 
    if (event.target && event.target.id === "Create_user") {
        swit = 0;
        const UserInput = document.querySelector(".User_names");
        UserNameValue = UserInput ? UserInput.value : "";
        const list = document.getElementById("Elements-list");
        const originalBox = list.querySelector(".box");
        if (UserNameValue.length > 25 ) {
            const newAllert = document.createElement('div');
            newAllert.id = `Error_window`;
            newAllert.className = 'Error_allerts';
            newAllert.innerHTML = `
                <p id="User_name_txt"> Имя слишком длинное </p>
                <button id="Close_error">ok</button>`;
            document.querySelector(".Error_allerts").appendChild(newAllert);
            swit = 1;
        }
        if (UserNameValue.length === 0 ) {
            const newAllert = document.createElement('div');
            newAllert.id = `Error_window`;
            newAllert.className = 'Error_allerts';
            newAllert.innerHTML = `
                <p id="User_name_txt">  Вы не ввели имя</p>
                <button id="Close_error">ok</button>`;
            document.querySelector(".Error_allerts").appendChild(newAllert);
            swit = 1;
        } 
        else if ((originalBox) && (swit == 0 )){
            const clonedBox = originalBox.cloneNode(true);
            clonedBox.id = `item-${itemCounter}`;
            clonedBox.innerHTML = `
                <button id="Duck"> Утка сраная</button>
                <p class="User_name">${UserNameValue}</p>
                <button id="Min">-</button>`
            list.appendChild(clonedBox);
            itemCounter++;
            const errorBox = event.target.closest(".Error_allerts");
            if (errorBox) {
                errorBox.remove();
        }
        } 
        
        else if (swit == 0){
            const newBox = document.createElement('div');
            itemCounter = 1
            newBox.id = `item-${itemCounter}`;
            newBox.className = 'box';
            newBox.innerHTML = `
                <button id="Duck"> Утка сраная</button>
                ${UserNameValue}
                <button id="Min">-</button>`
            list.appendChild(newBox);
            itemCounter++;
            const errorBox = event.target.closest(".Error_allerts");
            if (errorBox) {
                errorBox.remove();
        }
        }  
    }     
})

document.addEventListener("click", function(event) {
    if (event.target && event.target.id === "Close_error") {
        const errorBox = event.target.closest(".Error_allerts");
        if (errorBox) {
            errorBox.remove();
        }
    }
});

document.addEventListener("click", function(event) {
    if (event.target && event.target.id === "Duck") {
        const newAllert = document.createElement('div');
        newAllert.id = `Error_window`;
        newAllert.className = 'Error_allerts';
        newAllert.innerHTML = `
        <h4 id="User_name_txt"> Передайте этот код ${UserNameValue}</h4>
        <p id="User_code"> ${User_code} </p>
        <button id="Close_error"> Ок</button>`;
        document.querySelector(".Error_allerts").appendChild(newAllert);    
    }
});