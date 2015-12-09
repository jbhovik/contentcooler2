// React Router
// http://rackt.github.io/react-router/
var Router = ReactRouter;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var Route = Router.Route;
var RouteHandler = Router.RouteHandler;
var Redirect = Router.Redirect;

// Map of components
// App
//   Home
//   Login
//   Register
//   List
//     UploadMovieForm
//     MoviePlayer
//     ListItems
//       Item

// Top-level component for the app
var App = React.createClass({
    // context so the componevnt can access the router
    contextTypes: {
        router: React.PropTypes.func
    },

    // initial state
    getInitialState: function() {
        return {
            loggedIn: auth.loggedIn(),
        };
    },

    // callback when user is logged in
    setStateOnAuth: function(loggedIn) {
        this.state.loggedIn = loggedIn;
    },

    // when the component loads, setup the callback
    componentWillMount: function() {
        auth.onChange = this.setStateOnAuth;
    },

    // logout the user and redirect to home page
    logout: function(event) {
        auth.logout();
        this.context.router.replaceWith('/');
    },

    // show the navigation bar
    // the route handler replaces the RouteHandler element with the current page
    render: function() {
        return (
            <div>
            <nav className="navbar navbar-default" role="navigation">
            <div className="container">
            <div className="navbar-header">
            <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            </button>
            <a className="navbar-brand" href="/">Content Cooler</a>
            </div>
            <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
            {this.state.loggedIn ? (
                <ul className="nav navbar-nav">
                <li><a href="#/list">Library</a></li>
                <li><a href="#/movie-player">Movie Player</a></li>
                <li><a href="#" onClick={this.logout}>Logout</a></li>
                </ul>
                ) : (<div></div>)}
            </div>
            </div>
            </nav>
            <div className="container">
            <RouteHandler/>
            </div>
            </div>
            );

    }
});

// Home page, which shows Login and Register buttons
var Home = React.createClass({
    render: function() {
        return (
            <p>
            <Link className="btn btn-default" to="login">Login</Link> or <Link className="btn btn-warning" to="register">Register</Link>
            </p>
            );
    }
});

// Login page, shows the login form and redirects to the list if login is successful
var Login = React.createClass({
    // context so the component can access the router
    contextTypes: {
        router: React.PropTypes.func
    },

    // initial state
    getInitialState: function() {
        return {
            // there was an error on logging in
            error: false
        };

    },

    // handle login button submit
    login: function(event) {
        // prevent default browser submit
        event.preventDefault();
        // get data from form
        var username = this.refs.username.getDOMNode().value;
        var password = this.refs.password.getDOMNode().value;
        if (!username || !password) {
            return;
        }
        // login via API
        auth.login(username, password, function(loggedIn) {
            // login callback
            if (!loggedIn)
                return this.setState({
                    error: true
                });
            this.context.router.transitionTo('/list');
        }.bind(this));
    },

    // show the login form
    render: function() {
        return (
            <div>
            <h2>Login</h2>
            <form className="form-vertical" onSubmit={this.login}>
            <input type="text" placeholder="Username" ref="username" autoFocus={true} />
            <input type="password" placeholder="Password" ref="password"/>
            <input className="btn btn-warning" type="submit" value="Login" />
            {this.state.error ? (
                <div className="alert">Invalid username or password.</div>
                ) : null}
            </form>
            </div>
            );
    }
});

// Upload a movie component
var UploadMovieForm = React.createClass({
    // context so the component can access the router
    contextTypes: {
        router: React.PropTypes.func
    },

    _: function (el) {
        return document.getElementById(el);
    },

    upload: function() {
        event.preventDefault();
        event.stopPropagation();
        var fileInput = this._("file1").files[0];

        if (!fileInput) {
            return;
        }

        var formdata = new FormData();
        formdata.append("file1", fileInput);

        var ajax = new XMLHttpRequest();
        ajax.upload.addEventListener("progress", this.progressHandler, false);
        ajax.addEventListener("load", this.completeHandler, false);
        ajax.addEventListener("error", this.errorHandler, false);
        ajax.addEventListener("abort", this.abortHandler, false);
        ajax.open("POST", "/api/items");
        ajax.setRequestHeader("Authorization", localStorage.token);
        ajax.setRequestHeader("enctype","multipart/form-data");
        ajax.send(formdata);
        this.props.reload();
    },

    progressHandler: function(event) {
        this._("loaded_n_total").innerHTML = "Uploaded " + event.loaded + " bytes of " + event.total;
        var percent = (event.loaded / event.total) * 100;
        this._("progressBar").value = Math.round(percent);
        this._("status").innerHTML = Math.round(percent) + "% uploaded...please wait";
    },

    completeHandler: function(event) {
        this._("status").innerHTML = event.target.responseText;
        this._("progressBar").value = 0;
    },

    errorHandler: function (event) {
        this._("status").innerHTML = "Upload failed";
    },

    abortHandler: function (event) {
        this._("status").innerHTML = "Upload aborted";
    },

    // file form for movie upload
    render: function() {
        return (
            <div>
            <h1>Upload a movie</h1>
            <form className="uploadMovieForm" onSubmit={this.upload}>
            <input id="file1"type="file" name="file1"/>
            <input className="btn" id="upload1" type="submit" value="Upload" onClick={this.upload}/>
            <progress id="progressBar" value="0" max="100"></progress>
            <h3 id="status"></h3>
            <p id="loaded_n_total"></p>
            </form>
            </div>
            );
    }
});

// List entry component, handles adding new items to the list
var MoviePlayer = React.createClass({
    // context so the component can access the router
    contextTypes: {
        router: React.PropTypes.func
    },

    // initial state
    getInitialState: function() {
        return {
            // user's current movie
            currMovie: '',
            item: '',
        };
    },

    // when the component loads, get the list items
    componentDidMount: function() {
        api.getUserCurrMovie(this.currMovieCB);
    },

    // callback for getting the list of items, sets the list state
    currMovieCB: function(status, data) {
        if (status) {
            // set the state for the list of items
            this.setState({
                currMovie: data.currMovie,
            });
            //api.getItem(this.state.currMovie, this.getCurrMovieCB);
        } else {
            // if the API call fails, print error
            console.log('Failure in currMovie in MoviePlayer');
        }
    },

    // callback for getting the actual movie file
    getCurrMovieCB: function(status, data) {
        console.log('status in client', status);
        if (status) {
            // set the state for the list of items
            this.setState({
                item: data,
            });
            console.log('new movie file state', this.state);
        } else {
            // if the API call fails, print error
            console.log('Failure in getCurrMovieCB in MoviePlayer');
        }
    },

    // toggle controls
    getCurrMovieCB: function(status, data) {
        console.log('toggle');
    },

    render: function() {
        return (
            <div className="moviePlayer">
            <h1>Movie Player</h1>
            <video src='http://localhost:3000/api/items/CuPIg-nplMYyZMYnL0eS-0Qu.mp4'></video>
            <p onClick={this.toggleControls}>Toggle</p>
            </div>
        );
    }
});

// Register page, shows the registration form and redirects to the list if login is successful
var Register = React.createClass({
    // context so the component can access the router
    contextTypes: {
        router: React.PropTypes.func
    },

    // initial state
    getInitialState: function() {
        return {
            // there was an error registering
            error: false
        };
    },

    // handle regiser button submit
    register: function(event) {
        // prevent default browser submit
        event.preventDefault();
        // get data from form
        var name = this.refs.name.getDOMNode().value;
        var username = this.refs.username.getDOMNode().value;
        var password = this.refs.password.getDOMNode().value;
        if (!name || !username || !password) {
            return;
        }
        // register via the API
        auth.register(name, username, password, function(loggedIn) {
            // register callback
            if (!loggedIn)
                return this.setState({
                    error: true
                });
            this.context.router.replaceWith('/list');
        }.bind(this));
    },

    // show the registration form
    render: function() {
        return (
            <div>
            <h2>Register</h2>
            <form className="form-vertical" onSubmit={this.register}>
            <input type="text" placeholder="Name" ref="name" autoFocus={true} />
            <input type="text" placeholder="Username" ref="username"/>
            <input type="password" placeholder="Password" ref="password"/>
            <input className="btn" type="submit" value="Register" />
            {this.state.error ? (
                <div className="alert">Invalid username or password.</div>
                ) : null }
            </form>
            </div>
            );
    }
});

// List page, shows the todo list of items
var List = React.createClass({
    // context so the component can access the router
    contextTypes: {
        router: React.PropTypes.func
    },

    // initial state
    getInitialState: function() {
        return {
            // list of items in the todo list
            items: [],
            currItem: ''
        };
    },

    // when the component loads, get the list items
    componentDidMount: function() {
        api.getItems(this.listSet);
    },

    // reload the list of items
    reload: function() {
        api.getItems(this.listSet);
    },

    // callback for getting the list of items, sets the list state
    listSet: function(status, data) {
        if (status) {
            // set the state for the list of items
            this.setState({
                items: data.items
            });
        } else {
            // if the API call fails, redirect to the login page
            this.context.router.transitionTo('/login');
        }
    },

    // Show the list of items. This component has the following children: ListHeader, ListEntry and ListItems
    render: function() {
        var name = auth.getName();
        return (
            <section id="todoapp">
            <section id="main">
            <ListItems items={this.state.items} reload={this.reload}/>
            <UploadMovieForm items={this.state.items} reload={this.reload}/>
            </section>
            </section>
            );
    }
});

// List header, which shows who the list is for, the number of items in the list, and a button to clear completed items
var ListHeader = React.createClass({
    // handle the clear completed button submit    
    clearCompleted: function (event) {
        // loop through the items, and delete any that are complete
        this.props.items.forEach(function(item) {
            if (item.completed) {
                api.deleteItem(item, null);
            }
        });
        // XXX race condition because the API call to delete is async
        // reload the list
        this.props.reload();
    },

    // render the list header
    render: function() {
        // true if there are any completed items
        var completed = this.props.items.filter(function(item) {
            return item.completed;
        });
        return (
            <header id="header">
            <div className="row">
            <div className="col-md-6">
            <p><i>Lovingly created for {this.props.name}</i></p>
            <p>
            <span id="list-count" className="label label-default">
            <strong>{this.props.items.length}</strong> item(s)
            </span>
            </p>
            <p><i>Double-click to edit an item</i></p>
            </div>
            {completed.length > 0 ? (
                <div className="col-md-6 right">
                <button className="btn btn-warning btn-md" id="clear-completed" onClick={this.clearCompleted}>Clear completed ({completed.length})

                </button>
                </div>
                ) : null }
            </div>
            </header>
            );
    }
});

// List entry component, handles adding new items to the list
var ListEntry = React.createClass({
    // handles submit event for adding a new item
    addItem: function(event) {
        // prevent default browser submit
        event.preventDefault();
        // get data from form
        var title = this.refs.title.getDOMNode().value;
        if (!title) {
            return;
        }
        // call API to add item, and reload once added
        api.addItem(title, this.props.reload);
        this.refs.title.getDOMNode().value = '';
    },

    // render the item entry area
    render: function() {
        return (
            <header id="input">
            <form id="item-form" name="itemForm" onSubmit={this.addItem}>
            <input type="text" id="new-item" ref="title" placeholder="Enter a new item" autoFocus={true} />
            </form>
            </header>
            );

    }
});

// List items component, shows the list of items
var ListItems = React.createClass({
    // context so the component can access the router
    contextTypes: {
        router: React.PropTypes.func
    },

    // render the list of items
    render: function() {
        // get list of items to show, using the path to the current page
        var shown = this.props.items.filter(function(item) {
            switch (this.context.router.getCurrentPathname()) {
                case '/list/active':
                return !item.completed;
                case '/list/completed':
                return item.completed;
                default:
                return true;
            }
        }, this);

        // using the list of items, generate an Item element for each one
        var list = shown.map(function(item) {
            return (
                <Item key={item.id} item={item} reload={this.props.reload}/>
                );
        }.bind(this));

        // render the list
        return (
            <ul id="todo-list">
            {list}

            </ul>
            );
    }
});

// Item shown in the todo list
var Item = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },
    // initial state
    getInitialState: function () {
        return {
            // editing this item
            editing: false,
            // text saved before editing started
            editText: this.props.item.title
        };
    },
    // set the focus and selection range when this item is updated
    componentDidUpdate: function (prevProps, prevState) {
        if (!prevState.editing && this.state.editing) {
            var node = this.refs.editField.getDOMNode();
            node.focus();
            node.setSelectionRange(0, node.value.length);
        }
    },
    // when the item is completed, toggle its state and update it
    toggleCompleted: function() {
        this.props.item.completed = !this.props.item.completed;
        api.updateItem(this.props.item, this.props.reload);
    },
    // called when the delete button is clicked for this item
    deleteItem: function() {
        api.deleteItem(this.props.item, this.props.reload);
    },
    // called when the item is double-clicked
    editItem: function() {
        this.setState({editing: true, editText: this.props.item.title});
    },
    // called when the item is changed
    changeItem: function (event) {
        this.setState({editText: event.target.value});
    },
    // called when the enter key is entered after the item is edited
    saveItem: function(event) {
        if (!this.state.editing) {
            return;
        }
        var val = this.state.editText.trim();
        if (val) {
            this.setState({editing: false, editText: val});
            this.props.item.title = this.state.editText;
            // save the item
            api.updateItem(this.props.item, this.props.reload);
        } else {
            // delete the item if there is no text left any more
            api.deleteItem(this.props.item,this.props.reload);
        }
    },

    // load the movie
    updateUserCurrMovie: function (event) {
        api.updateUserCurrMovie(this.props.item, this.updateUserCurrMovieCB);
        this.context.router.transitionTo('/movie-player');
    },

    // callback for upload success
    updateUserCurrMovieCB: function(status, res) {
        if (status) {
            //console.log("success in updateUserCurrMovieCB");
            //console.log(res);
        } 
        else {
            console.log('no success in updateUserCurrMovieCB');
            console.log(res);
        }
    },

    // called when a key is pressed
    handleKeyDown: function (event) {
        var ESCAPE_KEY = 27;
        var ENTER_KEY = 13;
        // if the ESC key is pressed, then cancel editing
        // if the ENTER key is pressed, then save edited text
        if (event.which === ESCAPE_KEY) {
            this.setState({editing: false, editText: this.props.item.title});
        } else if (event.which === ENTER_KEY) {
            this.saveItem(event);
        }
    },
    // render the Item
    render: function() {
        // construct a list of classes for the item CSS
        var classes = "";
        if (this.props.item.completed) {
            classes += 'completed';
        }
        if (this.state.editing) {
            classes += ' editing';
        }
        return (
            <li className={classes}>
            <div className="view">
            <label onDoubleClick={this.updateUserCurrMovie}>{this.props.item.video}</label>
            <button className="destroy" onClick={this.deleteItem}></button>
            </div>
            <input ref="editField" className="edit" onKeyDown={this.handleKeyDown} onChange={this.changeItem} onSubmit={this.saveItem} onBlur={this.saveItem} value={this.state.editText} />
            </li>
            );
    }
});

// API object
var api = {
    // get the list of items, call the callback when complete
    getItems: function(cb) {
        var url = "/api/items";
        $.ajax({
            url: url,
            dataType: 'json',
            type: 'GET',
            headers: {'Authorization': localStorage.token},
            success: function(res) {
                if (cb)
                    cb(true, res);
            },
            error: function(xhr, status, err) {
                // if there is an error, remove the login token
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    },

    // get a single item
    getItem: function(item_id, cb) {
        var url = "/api/items/" + item_id;
        $.ajax({
            url: url,
            dataType: 'text',
            contentType : "application/json",
            mimeType : "video/mp4",
            processData : false,
            crossDomain : true,
            type: 'GET',
            headers: {
                'Authorization': localStorage.token,
                'Accept': '*/*',
            },
            success: function(res) {
                if (cb)
                    cb(true, res);
            },
            error: function(xhr, status, err) {
                console.log('Error sucka', err);
                // if there is an error, remove the login token
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    },

    // add an item, call the callback when complete
    addItem: function(title, cb) {
        var url = "/api/items";
        $.ajax({
            url: url,
            contentType: 'application/json',
            data: JSON.stringify({
                item: {
                    'title': title
                }
            }),
            type: 'POST',
            headers: {'Authorization': localStorage.token},
            success: function(res) {
                if (cb)
                    cb(true, res);
            },
            error: function(xhr, status, err) {
                // if there is an error, remove the login token
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });

    },
    // update an item, call the callback when complete
    updateItem: function(item, cb) {
        var url = "/api/items/" + item.id;
        $.ajax({
            url: url,
            contentType: 'application/json',
            data: JSON.stringify({
                item: {
                    title: item.title,
                    completed: item.completed
                }
            }),
            type: 'PUT',
            headers: {'Authorization': localStorage.token},
            success: function(res) {
                if (cb)
                    cb(true, res);
            },
            error: function(xhr, status, err) {
                // if there is any error, remove any login token
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    },

    // update an item, call the callback when complete
    updateUserCurrMovie: function(item, cb) {
        var url = "/api/users/";
        $.ajax({
            url: url,
            contentType: 'application/json',
            data: JSON.stringify({
                username: localStorage.name,
                currMovie: item.video,
            }),
            type: 'PUT',
            headers: {'Authorization': localStorage.token},
            success: function(res) {
                if (cb)
                    cb(true, res);
            },
            error: function(xhr, status, err) {
                // if there is any error, remove any login token
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    },

    getUserCurrMovie: function(cb) {
        var url = "/api/getCurrMovie/";
        $.ajax({
            url: url,
            dataType: 'json',
            type: 'GET',
            headers: {'Authorization': localStorage.token},
            success: function(res) {
                if (cb)
                    cb(true, res);
            },
            error: function(xhr, status, err) {
                // if there is an error, remove the login token
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    },

    // delete an item, call the callback when complete
    deleteItem: function(item, cb) {
        var url = "/api/items/" + item.id;
        $.ajax({
            url: url,
            type: 'DELETE',
            headers: {'Authorization': localStorage.token},
            success: function(res) {
                if (cb)
                    cb(true, res);
            },
            error: function(xhr, status, err) {
                // if there is an error, remove any login token
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    }

};

// authentication object
var auth = {
    register: function(name, username, password, cb) {
        // submit request to server, call the callback when complete
        var url = "/api/users/register";
        $.ajax({
            url: url,
            dataType: 'json',
            type: 'POST',
            data: {
                name: name,
                username: username,
                password: password,
                currMovie: ''
            },
            // on success, store a login token
            success: function(res) {
                localStorage.token = res.token;
                localStorage.name = res.name;
                if (cb)
                    cb(true);
                this.onChange(true);
            }.bind(this),
            error: function(xhr, status, err) {
                // if there is an error, remove any login token
                delete localStorage.token;
                if (cb)
                    cb(false);
                this.onChange(false);
            }.bind(this)
        });
    },
    // login the user
    login: function(username, password, cb) {
        // submit login request to server, call callback when complete
        cb = arguments[arguments.length - 1];
        // check if token in local storage
        if (localStorage.token) {
            if (cb)
                cb(true);
            this.onChange(true);
            return;
        }

        // submit request to server
        var url = "/api/users/login";
        $.ajax({
            url: url,
            dataType: 'json',
            type: 'POST',
            data: {
                username: username,
                password: password
            },
            success: function(res) {
                // on success, store a login token
                localStorage.token = res.token;
                localStorage.name = res.name;
                if (cb)
                    cb(true);
                this.onChange(true);
            }.bind(this),
            error: function(xhr, status, err) {
                // if there is an error, remove any login token
                delete localStorage.token;
                if (cb)
                    cb(false);
                this.onChange(false);
            }.bind(this)
        });
    },
    // get the token from local storage
    getToken: function() {
        return localStorage.token;
    },
    // get the name from local storage
    getName: function() {
        return localStorage.name;
    },
    // logout the user, call the callback when complete
    logout: function(cb) {
        delete localStorage.token;
        if (cb) cb();
        this.onChange(false);
    },
    // check if user is logged in
    loggedIn: function() {
        return !!localStorage.token;
    },
    // default onChange function
    onChange: function() {},
};

// routes for the app
var routes = (
    <Route name="app" path="/" handler={App}>
	    <Route name="list" path ="/list" handler={List}/>
	    <Route name="movie-player" path = "/movie-player" handler={MoviePlayer}/>
	    <Route name="login" handler={Login}/>
	    <Route name="register" handler={Register}/>
    <DefaultRoute handler={Home}/>
    </Route>
    );

// Run the routes
Router.run(routes, function(Handler) {
    React.render(<Handler/>, document.body);
});
