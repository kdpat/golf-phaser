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

      <button phx-click="start_game">Start Game</button>
    </div>
    """
  end

  @impl true
  def mount(%{"id" => id}, session, socket) do
    user = Golf.Users.get_user_by_session_id(session["session_id"])

    if connected?(socket) do
      send(self(), {:load_lobby, id})
    end

    {:ok,
     socket
     |> assign(page_title: "Lobby", id: id, user: user, lobby: nil)
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
        {:noreply,
         socket
         |> assign(lobby: lobby)
         |> stream(:users, lobby.users)}
    end
  end

  @impl true
  def handle_event("start_game", _params, socket) do
    id = socket.assigns.id
    lobby = socket.assigns.lobby
    game = Golf.GamesDb.create_game(id, socket.assigns.user, lobby.users)
    Golf.broadcast!(topic(id), {:game_created, game})
    {:noreply, redirect(socket, to: ~p"/game/#{id}")}
  end

  defp topic(id), do: "lobby:#{id}"
end
