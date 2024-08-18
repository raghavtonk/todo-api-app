let Skip = 0;
window.onload = genrateTodos;

function genrateTodos(){
    // fetch("/read-item")
    axios
    .get(`/read-item?skip=${Skip}`)
    .then(res=>{
        if(res.data.status !== 200){
            alert(res.data.message);
            return;
        }
        const todoData = res.data.data;
        Skip += todoData.length;
        document.getElementById("item_list").insertAdjacentHTML(
            "beforeend",
            todoData
              .map((item) => {
                return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
          <span class="item-text"> ${item.todoText}</span>
          <div>
          <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
          <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
          </div></li>`;
              })
              .join("")
          );

    })
    .catch((error)=>{
        console.log(error)
    });
}
document.addEventListener("click",(event)=>{
    //edit todo
    if(event.target.classList.contains("edit-me")){

        const todoId = event.target.getAttribute("data-id");
        const newData = prompt("Enter todo text ,length should be 3-80 char");
        console.log(todoId,newData)
        // axios
        // .post('/edit-todo',{newData,todoId})
        // .then((res)=>{
        //     console.log(res);
        //     event.target.parentElement.parentElement.querySelector(".item-text").innerHTML = newData;
        // })
        // .catch((error)=>alert(error.response.data.message))

        fetch("/edit-todo",{
            method: "POST",
            headers:{
                "Content-Type": "application/json"
            },
            body:JSON.stringify({                
                newData,
                todoId
            })
        }).then((res)=> res.json())
        .then((res)=>{
            if(res.status !== 200){
                alert(res.message);
                return
            }
            event.target.parentElement.parentElement.querySelector(".item-text").innerHTML = newData;
        })
        .catch(error=>{
            console.log(error)
        })
   
    }
    //delete todo
    if(event.target.classList.contains('delete-me')){
        const todoId = event.target.getAttribute('data-id');

        fetch('/delete-todo',{
            method: "POST",
            headers:{
                "Content-Type": "application/json"
            },
            body:JSON.stringify({
                todoId
            })
        })
        .then(res=>res.json())
        .then((res)=>{
           
            if(res.status !== 200){
                alert(res.message);
                return;
            }
            event.target.parentElement.parentElement.remove()
        })
        .catch(error=>console.log(error))
    }

    //create todo
    if(event.target.classList.contains('add_item')){
        const todoText = document.getElementById('create_field').value;

        fetch('/create-item',{
            method: "POST",
            headers:{
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                todoText,
            })
        })
        .then(res=>res.json())
        .then((res)=>{
          console.log(Skip)
            if(res.status !== 201){
                alert(res.message);
                return
            }
            document.getElementById('create_field').value = "";
            if(Skip < 5){
            document.getElementById("item_list").insertAdjacentHTML(
                "beforeend",
                
                `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
              <span class="item-text"> ${res.data.todoText}</span>
              <div>
              <button data-id="${res.data._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
              <button data-id="${res.data._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
              </div></li>`
            );   
            Skip += 1; 
        } 
           
            console.log(Skip)      
        })
        .catch(error=>console.log(error));
    }
    if(event.target.classList.contains('logout')){
        console.log(event.target)
        axios
        .post('/logout')
        .then(res=>console.log(res))
        .catch(err=>console.log(err))
    }
    if(event.target.classList.contains('logout-all')){
        console.log(event.target)
        axios
        .post('/logout-out-from-all')
        .then(res=>console.log(res))
        .catch(err=>console.log(err))
    }

    if(event.target.classList.contains('show-more')){
        genrateTodos();
    }
})