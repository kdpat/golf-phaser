defmodule GolfWeb.LobbyLive do
  use GolfWeb, :live_view

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h2>Lobby <%= @id %></h2>

      <div class="players">
        <h4>Players</h4>
        <ol id="players-list" phx-update="stream">
          <li :for={{dom_id, user} <- @streams.users} id={dom_id}>
            <span><%= user.name %></span>
          </li>
        </ol>
      </div>

      <!--
      @game_exists? will be nil on mount, and true or false after the db is checked.
      If it's nil we don't want to show it, so explicitly check for false.
      -->
      <button :if={@host? && @game_exists? == false} phx-click="start_game">
        Start Game
      </button>

      <button :if={@game_exists?} phx-click="go_to_game">
        Go To Game
      </button>
    </div>
    """
  end

  @impl true
  def mount(%{"id" => id}, session, socket) do
    user = Golf.Users.get_user_by_session_id(session["session_id"])

    if connected?(socket) do
      send(self(), {:load_lobby, id})
      send(self(), {:load_game_exists?, id})
    end

    {:ok,
     socket
     |> assign(page_title: "Lobby", id: id, user: user, lobby: nil, host?: nil, game_exists?: nil)
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

  defp topic(id), do: "lobby:#{id}"
end
