defmodule GolfWeb.LobbyLive do
  use GolfWeb, :live_view

  @impl true
  def render(assigns) do
    ~H"""
    <div id="lobby-page">
      <h2>Lobby <%= @id %></h2>

      <div>
        <p class="lobby-link-info">Send this link to invite players:</p>
        <div class="lobby-link"><%= @join_url %></div>
      </div>

      <div class="players">
        <h4>Players</h4>
        <ul id="players-list" phx-update="stream">
          <li :for={{dom_id, user} <- @streams.users} id={dom_id}>
            <span><%= user.name %></span>
          </li>
        </ul>
      </div>

      <div>
        <!--
      @game_exists? will be nil on mount, and true or false after the db is checked.
      If it's nil (the data isn't loaded yet) we don't want to show it, so explicitly check for false.
      -->
        <button :if={@host? && @game_exists? == false} phx-click="start_game">
          Start Game
        </button>

        <button :if={@game_exists?} phx-click="go_to_game">
          Go To Game
        </button>
      </div>

      <.form class="username-form" for={@name_form} phx-submit="update_username">
        <.input type="text" field={@name_form[:name]} />
        <button>Update Name</button>
      </.form>

      <p class="user">User: <%= "#{@user.name}(id=#{@user.id})" %></p>
    </div>
    """
  end

  @impl true
  def mount(%{"id" => id}, session, socket) do
    user = Golf.Users.get_user_by_session_id(session["session_id"])
    join_url = "#{GolfWeb.Endpoint.url()}/lobby/join/#{id}"
    name_form = Golf.Users.change_user(user) |> to_form()

    if connected?(socket) do
      send(self(), {:load_lobby, id})
      send(self(), {:load_game_exists?, id})
    end

    {:ok,
     socket
     |> assign(
       page_title: "Lobby",
       id: id,
       user: user,
       join_url: join_url,
       lobby: nil,
       host?: nil,
       game_exists?: nil,
       name_form: name_form
     )
     |> stream(:users, [])}
  end

  @impl true
  def handle_info({:load_lobby, id}, socket) do
    case Golf.Lobbies.get_lobby(id) do
      nil ->
        {:noreply,
         socket
         |> put_flash(:error, "Lobby #{id} not found.")
         |> push_navigate(to: ~p"/")}

      lobby ->
        Golf.subscribe!(topic(id))
        host? = socket.assigns.user.id == lobby.host_id

        {:noreply,
         socket
         |> assign(lobby: lobby, host?: host?)
         |> stream(:users, lobby.users)}
    end
  end

  @impl true
  def handle_info({:load_game_exists?, id}, socket) do
    exists? = Golf.GamesDb.game_exists?(id)
    {:noreply, assign(socket, game_exists?: exists?)}
  end

  @impl true
  def handle_info({:user_joined, lobby, new_user}, socket) do
    {:noreply,
     socket
     |> assign(lobby: lobby)
     |> stream_insert(:users, new_user)
     |> put_flash(:info, "User joined: #{new_user.name}")}
  end

  @impl true
  def handle_info({:game_created, game}, socket) do
    {:noreply, redirect(socket, to: ~p"/game/#{game.id}")}
  end

  @impl true
  def handle_info({:username_updated, lobby, _updated_user}, socket) do
    {:noreply,
     socket
     |> assign(lobby: lobby)
     |> stream(:users, lobby.users)}
  end

  @impl true
  def handle_event("start_game", _params, socket) do
    id = socket.assigns.id
    game = Golf.GamesDb.create_game(id, socket.assigns.user, socket.assigns.lobby.users)
    Golf.broadcast!(topic(id), {:game_created, game})
    {:noreply, redirect(socket, to: ~p"/game/#{id}")}
  end

  @impl true
  def handle_event("go_to_game", _params, socket) do
    {:noreply, redirect(socket, to: ~p"/game/#{socket.assigns.id}")}
  end

  @impl true
  def handle_event("update_username", %{"user" => user_params}, socket) do
    case Golf.Users.update_user(socket.assigns.user, user_params) do
      {:ok, user} ->
        id = socket.assigns.id
        lobby = Golf.Lobbies.get_lobby(id)
        Golf.broadcast!(topic(id), {:username_updated, lobby, user})
        form = Golf.Users.change_user(user) |> to_form()
        {:noreply, assign(socket, user: user, lobby: lobby, name_form: form)}

      {:error, changeset} ->
        {:noreply, assign(socket, name_form: to_form(changeset))}
    end
  end

  defp topic(id), do: "lobby:#{id}"
end
