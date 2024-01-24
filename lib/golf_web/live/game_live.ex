defmodule GolfWeb.GameLive do
  use GolfWeb, :live_view

  import GolfWeb.AppComponents, only: [chat: 1]

  alias Golf.{Games, GamesDb}
  alias Golf.Games.{Event, GameData}

  @impl true
  def render(assigns) do
    ~H"""
    <div id="game-page">
      <div id="game-canvas" phx-hook="GameCanvas" phx-update="ignore"></div>
      <div id="game-info" class={@game_info_class}>
        <h2 class="game-title">Game <span class="game-id"><%= @game_id %></span></h2>
        <.total_scores_table scores={@total_scores} />
        <ul class="round-scores">
          <li :for={{round_scores, i} <- Enum.zip(@scores, length(@scores)..1)}>
            <h4>Round <%= i %></h4>
            <ul class="player-scores">
              <.player_score
                :for={player <- round_scores}
                name={player.user.name}
                turn={player.turn + 1}
                score={player.score}
              />
            </ul>
          </li>
        </ul>
        <.chat messages={@streams.chat_messages} submit="submit_chat" />
        <div id="camera-controls">
          <button id="zoom-out">-</button>
          <button id="zoom-in">+</button>
          <button id="reset-camera">Reset Camera</button>
        </div>
      </div>
      <div id="toggle-sidebar" phx-click="toggle_sidebar"></div>
    </div>
    """
  end

  @impl true
  def mount(%{"id" => game_id}, session, socket) do
    user = Golf.Users.get_user_by_session_id(session["session_id"])

    if connected?(socket) do
      send(self(), {:load_game, game_id})
      send(self(), {:load_chat_messages, game_id})
    end

    {:ok,
     assign(socket,
       page_title: "Game",
       user: user,
       game_id: game_id,
       game_info_class: "active",
       game: nil,
       scores: [],
       total_scores: []
     )
     |> stream(:chat_messages, [])}
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
        round_scores = Games.round_scores(game)
        total_scores = Games.total_scores(game) |> dbg()

        {:noreply,
         socket
         |> assign(game: game, scores: round_scores, total_scores: total_scores)
         |> push_event("game_loaded", %{"game" => data})}
    end
  end

  @impl true
  def handle_info({:load_chat_messages, id}, socket) do
    messages =
      Golf.Chat.get_messages(id)
      |> Enum.map(&Golf.Chat.put_player_turn(&1, socket.assigns.game.players))

    Golf.subscribe!("chat:#{id}")
    {:noreply, stream(socket, :chat_messages, messages, at: 0)}
  end

  @impl true
  def handle_info({:round_started, game}, socket) do
    data = GameData.new(game, socket.assigns.user)
    scores = Games.round_scores(game)
    total_scores = Games.total_scores(game)

    {:noreply,
     socket
     |> assign(game: game, scores: scores, total_scores: total_scores)
     |> push_event("round_started", %{"game" => data})}
  end

  @impl true
  def handle_info({:game_event, game, event}, socket) do
    data = GameData.new(game, socket.assigns.user)
    scores = Games.round_scores(game)
    total_scores = Games.total_scores(game)

    {:noreply,
     assign(socket, game: game, scores: scores, total_scores: total_scores)
     |> push_event("game_event", %{"game" => data, "event" => event})}
  end

  @impl true
  def handle_info({:new_chat_message, message}, socket) do
    message = Golf.Chat.put_player_turn(message, socket.assigns.game.players)
    {:noreply, stream_insert(socket, :chat_messages, message, at: 0)}
  end

  @impl true
  def handle_event("toggle_sidebar", _params, socket) do
    class =
      if socket.assigns.game_info_class == "" do
        "active"
      else
        ""
      end

    {:noreply, assign(socket, game_info_class: class)}
  end

  @impl true
  def handle_event("submit_chat", %{"text" => text}, socket) do
    id = socket.assigns.game_id

    message =
      Golf.Chat.ChatMessage.new(id, socket.assigns.user, text)
      |> Golf.Chat.insert_message!()
      |> Map.update!(:inserted_at, &Golf.Chat.format_chat_time/1)

    Golf.broadcast!("chat:#{id}", {:new_chat_message, message})
    {:noreply, push_event(socket, "clear-chat-input", %{})}
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
    player = Games.find_player_by_user_id(game.players, socket.assigns.user.id)

    state = Games.current_state(game)
    action = Games.action_at(state, params["place"])
    event = Event.new(player.id, action, params["handIndex"])
    {:ok, game} = GamesDb.handle_event(game, event)

    Golf.broadcast!(topic(game.id), {:game_event, game, event})
    {:noreply, socket}
  end

  defp topic(game_id), do: "game:#{game_id}"

  def total_scores_table(assigns) do
    ~H"""
    <table class="total-scores-table">
      <thead>
        <tr>
          <th :for={player <- @scores} class={"player-score turn-#{player.turn + 1}"}>
            <%= player.user.name %>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td :for={player <- @scores}>
            <%= player.total_score %>
          </td>
        </tr>
      </tbody>
    </table>
    """
  end

  def player_score(assigns) do
    ~H"""
    <li>
      <p class={"player-score turn-#{@turn}"}>
        <span class="player-name"><%= @name %></span>: <%= @score %>
      </p>
    </li>
    """
  end
end
