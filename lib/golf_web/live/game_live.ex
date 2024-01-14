defmodule GolfWeb.GameLive do
  use GolfWeb, :live_view
  alias Golf.GamesDb

  @impl true
  def render(assigns) do
    ~H"""
    <div class="game">
      <h2>Game <%= @game_id %></h2>
      <div id="game-canvas" phx-hook="GameCanvas" phx-update="ignore"></div>
    </div>
    """
  end

  @impl true
  def mount(%{"id" => id}, session, socket) do
    session_id = session["session_id"]
    user = Golf.Users.get_user_by_session_id(session_id)
    game_id = String.to_integer(id)
    send(self(), {:load_game, game_id})
    {:ok, assign(socket, page_title: "Game", user: user, game_id: game_id, game: nil)}
  end

  @impl true
  def handle_info({:load_game, id}, socket) do
    case GamesDb.get_game(id) do
      nil ->
        {:noreply,
         socket
         |> push_navigate(to: ~p"/")
         |> put_flash(:error, "Game #{id} not found.")}

      game ->
        {:noreply, assign(socket, game: game)}
    end
  end
end
