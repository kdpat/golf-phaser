defmodule GolfWeb.GameLive do
  use GolfWeb, :live_view
  alias Golf.{GamesDb}
  alias Golf.Games.GameData

  @impl true
  def render(assigns) do
    ~H"""
    <div class="game">
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
        subscribe!(topic(game.id))
        data = GameData.new(game, socket.assigns.user)

        {:noreply,
         socket
         |> assign(game: game)
         |> push_event("game_loaded", %{"game" => data})}
    end
  end

  @impl true
  def handle_info({:round_started, game}, socket) do
    data = GameData.new(game, socket.assigns.user)

    {:noreply,
     socket
     |> assign(game: game)
     |> push_event("round_started", %{"game" => data})}
  end

  @impl true
  def handle_event("start_round", _params, socket) do
    {:ok, game} = GamesDb.create_round(socket.assigns.game)
    broadcast!(topic(game.id), {:round_started, game})
    {:noreply, socket}
  end

  defp topic(game_id), do: "game:#{game_id}"

  defp subscribe!(topic) do
    :ok = Phoenix.PubSub.subscribe(Golf.PubSub, topic)
  end

  defp broadcast!(topic, msg) do
    Phoenix.PubSub.broadcast!(Golf.PubSub, topic, msg)
  end
end
