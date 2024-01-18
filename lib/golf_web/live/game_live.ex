defmodule GolfWeb.GameLive do
  use GolfWeb, :live_view

  alias Golf.{Games, GamesDb}
  alias Golf.Games.{Event, GameData}

  @impl true
  def render(assigns) do
    ~H"""
    <div class="game-page">
      <div id="game-canvas" phx-hook="GameCanvas" phx-update="ignore">
      </div>
    </div>
    """
  end

  @impl true
  def mount(%{"id" => game_id}, session, socket) do
    user = Golf.Users.get_user_by_session_id(session["session_id"])

    if connected?(socket) do
      send(self(), {:load_game, game_id})
    end

    {:ok,
     socket
     |> assign(page_title: "Game", user: user, game_id: game_id, game: nil)}
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
        Golf.subscribe!(topic(game.id))
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
  def handle_info({:game_event, game, event}, socket) do
    data = GameData.new(game, socket.assigns.user)

    {:noreply,
     assign(socket, game: game)
     |> push_event("game_event", %{"game" => data, "event" => event})}
  end

  @impl true
  def handle_event("start_round", _params, socket)
      when socket.assigns.user.id == socket.assigns.game.host_id do
    {:ok, game} = GamesDb.create_round(socket.assigns.game)
    Golf.broadcast!(topic(game.id), {:round_started, game})
    {:noreply, socket}
  end

  @impl true
  def handle_event("card_click", params, socket) do
    game = socket.assigns.game
    player = find_player_by_user_id(game.players, socket.assigns.user.id)

    state = Games.current_state(game)
    action = action_at(state, params["place"])
    event = Event.new(player.id, action, params["handIndex"])
    {:ok, game} = GamesDb.handle_event(game, event)

    Golf.broadcast!(topic(game.id), {:game_event, game, event})
    {:noreply, socket}
  end

  defp topic(game_id), do: "game:#{game_id}"

  defp action_at(state, "hand") when state in [:flip_2, :flip], do: :flip
  defp action_at(:take, "table"), do: :take_table
  defp action_at(:take, "deck"), do: :take_deck
  defp action_at(:hold, "table"), do: :discard
  defp action_at(:hold, "held"), do: :discard
  defp action_at(:hold, "hand"), do: :swap

  defp find_player_by_user_id(players, user_id) do
    Enum.find(players, fn p -> p.user_id == user_id end)
  end
end
