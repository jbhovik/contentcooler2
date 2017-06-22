var Router = ReactRouter;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var Route = Router.Route;
var RouteHandler = Router.RouteHandler;
var Redirect = Router.Redirect;

var App = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },

    getInitialState: function() {
        return {
            loggedIn: auth.loggedIn(),
        };
    },

    setStateOnAuth: function(loggedIn) {
        this.state.loggedIn = loggedIn;
    },

    componentWillMount: function() {
        auth.onChange = this.setStateOnAuth;
    },

    logout: function(event) {
        auth.logout();
        this.context.router.replaceWith('/');
    },

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
                                    <li><a href="#/list">Content Library</a></li>
                                    <li><a href="#/movie-player">Content Player</a></li>
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

var Home = React.createClass({
    render: function() {
        return (
            <p>
                <Link className="btn btn-default" to="login">Login</Link> or <Link className="btn btn-warning" to="register">Register</Link>
            </p>
        );
    }
});

var Login = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },

    getInitialState: function() {
        return {
            error: false
        };
    },

    login: function(event) {
        event.preventDefault();
        var username = this.refs.username.getDOMNode().value;
        var password = this.refs.password.getDOMNode().value;
        if (!username || !password) {
            return;
        }
        auth.login(username, password, function(loggedIn) {
            if (!loggedIn)
                return this.setState({
                    error: true
                });
            this.context.router.transitionTo('/list');
        }.bind(this));
    },

    render: function() {
        return (
            <div>
                <h2>Login</h2>
                <form className="form-vertical" onSubmit={this.login}>
                    <input type="text" placeholder="Username" ref="username" autoFocus={true} />
                    <input type="password" placeholder="Password" ref="password"/>
                    <input className="btn btn-warning" type="submit" value="Login" />
                    {this.state.error ? 
                        (<div className="alert">Invalid username or password.</div>) : 
                        null
                    }
                </form>
            </div>
        );
    }
});

var UploadMovieForm = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },

    getInitialState: function() {
        return {
            items: this.props.items
        };
    },

    _: function (el) {
        return document.getElementById(el);
    },

    upload: function(event) {
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
        ajax.setRequestHeader("type", fileInput.type);
        ajax.send(formdata);
    },

    progressHandler: function(event) {
        this._("loaded_n_total").innerHTML = "Uploaded " + event.loaded + " bytes of " + event.total;
        var percent = (event.loaded / event.total) * 100;
        this._("progressBar").value = Math.round(percent);
        this._("status").innerHTML = Math.round(percent) + "% uploaded...please wait";
    },

    completeHandler: function(event) {
        this._("status").innerHTML = "Content uploaded!";
        this._("progressBar").value = 0;
        this.props.reload();
    },

    errorHandler: function (event) {
        this._("status").innerHTML = "Upload failed";
    },

    abortHandler: function (event) {
        this._("status").innerHTML = "Upload aborted";
    },

    render: function() {
        return (
            <div>
                <h1>Upload some content</h1>
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

var MoviePlayer = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },

    getInitialState: function() {
        return {
            currMovie: '',
            item: '',
        };
    },

    componentDidMount: function() {
        api.getUserCurrMovie(this.currMovieCB);
    },

    currMovieCB: function(status, data) {
        if (status) {
            var my_url;
            if (data.currMovie === '') {
                my_url = '';
            } else {
                my_url = 'http://localhost:3000/api/items/' + data.currMovie
            }
            this.setState({
                currMovie: my_url,
            });
        } else {
            console.log('Failure in currMovie in MoviePlayer');
        }
    },

    getCurrMovieCB: function(status, data) {
        if (status) {
            this.setState({
                item: data,
            });
        } else {
            console.log('Failure in getCurrMovieCB in MoviePlayer');
        }
    },

    render: function() {
        var movieHtml;
        if (this.state.currMovie === '') {
            movieHtml = <h1>Please select something from Content Library</h1>;
        } else {
            fileType = localStorage.contentCoolerType;
            if (fileType.indexOf("video") != -1) {
                movieHtml = <video width="640" height="480" src={this.state.currMovie} controls></video>;
            } else if (fileType.indexOf("audio") != -1) {
                movieHtml = <audio src={this.state.currMovie} controls></audio>;
            } else if (fileType.indexOf("image") != -1) {
                movieHtml = <img width="640" height="480" src={this.state.currMovie}></img>;
            } else {
                movieHtml = <p>Unknown file type</p>;
            }
        }
        return (
            <div className="moviePlayer">
                <h1>Content Player</h1>
                {movieHtml}
            </div>
        );
    }
});

var Register = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },

    getInitialState: function() {
        return {
            error: false
        };
    },

    register: function(event) {
        event.preventDefault();
        var name = this.refs.name.getDOMNode().value;
        var username = this.refs.username.getDOMNode().value;
        var password = this.refs.password.getDOMNode().value;
        if (!name || !username || !password) {
            return;
        }
        auth.register(name, username, password, function(loggedIn) {
            if (!loggedIn)
                return this.setState({
                    error: true
                });
            this.context.router.replaceWith('/list');
        }.bind(this));
    },

    render: function() {
        return (
            <div>
                <h2>Register</h2>
                <form className="form-vertical" onSubmit={this.register}>
                    <input type="text" placeholder="Name" ref="name" autoFocus={true} />
                    <input type="text" placeholder="Username" ref="username"/>
                    <input type="password" placeholder="Password" ref="password"/>
                    <input className="btn" type="submit" value="Register" />
                    {this.state.error ? 
                        (<div className="alert">Invalid username or password.</div>) : 
                        null 
                    }
                </form>
            </div>
        );
    }
});

var List = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },

    getInitialState: function() {
        return {
            items: [],
            currItem: '',
            filter: 'items'
        };
    },

    componentDidMount: function() {
        this.loadItems();
    },

    reload: function() {
        api.getItems(this.listSet, this.state.filter);
    },

    loadItems: function() {
        this.setState({
                filter: 'items'
            });
        api.getItems(this.listSet, 'items');
    },

    loadFavorites: function() {
        this.setState({
                filter: 'favorites'
            });
        api.getItems(this.listSet, 'favorites');
    },

    loadVideos: function() {
        this.setState({
                filter: 'videos'
            });
        api.getItems(this.listSet, 'videos');
    },

    loadAudios: function() {
        this.setState({
                filter: 'audios'
            });
        api.getItems(this.listSet, 'audios');
    },

    loadImages: function() {
        this.setState({
                filter: 'images'
            });
        api.getItems(this.listSet, 'images');
    },

    listSet: function(status, data) {
        if (status) {
            this.setState({
                items: data.items
            });
        } else {
            this.context.router.transitionTo('/login');
        }
    },

    render: function() {
        var name = auth.getName();
        return (
            <section id="todoapp">
                <section id="main">
                    <UploadMovieForm items={this.state.items} reload={this.reload}/>
                    <h1>Your Content (Click to enjoy)</h1>
                    <form>
                        <input className="btn" type="submit" value="All Files" onClick={this.loadItems}/>
                        <input className="btn" type="submit" value="My Favorites" onClick={this.loadFavorites}/>
                        <input className="btn" type="submit" value="Videos" onClick={this.loadVideos}/>
                        <input className="btn" type="submit" value ="Songs" onClick={this.loadAudios}/>
                        <input className="btn" type="submit" value ="Pictures" onClick={this.loadImages}/>
                    </form>
                    <ListItems items={this.state.items} reload={this.reload}/>
                </section>
            </section>
        );
    }
});

var ListEntry = React.createClass({
    addItem: function(event) {
        event.preventDefault();
        var title = this.refs.title.getDOMNode().value;
        if (!title) {
            return;
        }
        api.addItem(title, this.props.reload);
        this.refs.title.getDOMNode().value = '';
    },

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

var ListItems = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },

    render: function() {
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

        var list = shown.map(function(item) {
            return (
                <Item key={item.id} item={item} reload={this.props.reload}/>
            );
        }.bind(this));

        return (
            <ul id="todo-list">
                {list}
            </ul>
        );
    }
});

var Item = React.createClass({
    contextTypes: {
        router: React.PropTypes.func
    },

    getInitialState: function () {
        return {
            editing: false,
            editText: this.props.item.title
        };
    },

    componentDidUpdate: function (prevProps, prevState) {
        if (!prevState.editing && this.state.editing) {
            var node = this.refs.editField.getDOMNode();
            node.focus();
            node.setSelectionRange(0, node.value.length);
        }
    },

    toggleCompleted: function() {
        this.props.item.isfavorite = !this.props.item.isfavorite;
        api.updateItem(this.props.item, this.props.reload);
    },

    deleteItem: function() {
        api.deleteItem(this.props.item, this.props.reload);
    },

    editItem: function() {
        this.setState({editing: true, editText: this.props.item.title});
    },

    changeItem: function (event) {
        this.setState({editText: event.target.value});
    },

    saveItem: function(event) {
        if (!this.state.editing) {
            return;
        }
        var val = this.state.editText.trim();
        if (val) {
            this.setState({editing: false, editText: val});
            this.props.item.title = this.state.editText;
            api.updateItem(this.props.item, this.props.reload);
        } else {
            api.deleteItem(this.props.item,this.props.reload);
        }
    },

    updateUserCurrMovie: function (event) {
        localStorage.contentCoolerType = this.props.item.type;
        api.updateUserCurrMovie(this.props.item, this.updateUserCurrMovieCB);
        this.context.router.transitionTo('/movie-player');
    },

    updateUserCurrMovieCB: function(status, res) {
        if (status) {
            console.log("success in updateUserCurrMovieCB");
            console.log(res);
        } else {
            console.log('no success in updateUserCurrMovieCB');
            console.log(res);
        }
    },

    handleKeyDown: function (event) {
        var ESCAPE_KEY = 27;
        var ENTER_KEY = 13;
        if (event.which === ESCAPE_KEY) {
            this.setState({editing: false, editText: this.props.item.title});
        } else if (event.which === ENTER_KEY) {
            this.saveItem(event);
        }
    },

    render: function() {
        var classes = "";
        if (this.props.item.isfavorite) {
            classes += 'isfavorite';
        }
        if (this.state.editing) {
            classes += ' editing';
        }
        return (
            <li className={classes}>
                <div className="view">
                    <input id={this.props.item.id} className="toggle" type="checkbox" onChange={this.toggleCompleted.bind(this,this.props.item)} checked={this.props.item.isfavorite} />
                    <label className="check" htmlFor={this.props.item.id}/>
                    <label onClick={this.updateUserCurrMovie}>{this.props.item.title}</label>
                    <button className="destroy" onClick={this.deleteItem}></button>
                </div>
                <input ref="editField" className="edit" onKeyDown={this.handleKeyDown} onChange={this.changeItem} onSubmit={this.saveItem} onBlur={this.saveItem} value={this.state.editText} />
            </li>
        );
    }
});

var api = {
    getItems: function(cb, type) {
        var url = "/api/" + type;
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
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    },

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
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    },

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
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    },

    updateItem: function(item, cb) {
        var url = "/api/items/" + item.id;
        $.ajax({
            url: url,
            contentType: 'application/json',
            data: JSON.stringify({
                item: {
                    title: item.title,
                    isfavorite: item.isfavorite
                }
            }),
            type: 'PUT',
            headers: {'Authorization': localStorage.token},
            success: function(res) {
                if (cb)
                    cb(true, res);
            },
            error: function(xhr, status, err) {
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    },

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
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    },

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
                delete localStorage.token;
                if (cb)
                    cb(false, status);
            }
        });
    }
};

var auth = {
    register: function(name, username, password, cb) {
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
            success: function(res) {
                localStorage.token = res.token;
                localStorage.name = res.name;
                if (cb)
                    cb(true);
                this.onChange(true);
            }.bind(this),
            error: function(xhr, status, err) {
                delete localStorage.token;
                if (cb)
                    cb(false);
                this.onChange(false);
            }.bind(this)
        });
    },

    login: function(username, password, cb) {
        cb = arguments[arguments.length - 1];
        if (localStorage.token) {
            if (cb)
                cb(true);
            this.onChange(true);
            return;
        }

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
                localStorage.token = res.token;
                localStorage.name = res.name;
                if (cb)
                    cb(true);
                this.onChange(true);
            }.bind(this),
            error: function(xhr, status, err) {
                delete localStorage.token;
                if (cb)
                    cb(false);
                this.onChange(false);
            }.bind(this)
        });
    },

    getToken: function() {
        return localStorage.token;
    },

    getName: function() {
        return localStorage.name;
    },

    logout: function(cb) {
        delete localStorage.token;
        if (cb) cb();
        this.onChange(false);
    },

    loggedIn: function() {
        return !!localStorage.token;
    },

    onChange: function() {},
};

var routes = (
    <Route name="app" path="/" handler={App}>
	    <Route name="list" path ="/list" handler={List}/>
	    <Route name="movie-player" path = "/movie-player" handler={MoviePlayer}/>
	    <Route name="login" handler={Login}/>
	    <Route name="register" handler={Register}/>
        <DefaultRoute handler={Home}/>
    </Route>
);

Router.run(routes, function(Handler) {
    React.render(<Handler/>, document.body);
});
