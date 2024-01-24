defmodule GolfWeb.LobbyLive do
  use GolfWeb, :live_view

  import GolfWeb.AppComponents, only: [chat: 1]

  @impl true
  def render(assigns) do
    ~H"""
    <div id="lobby-page">
      <h2>Lobby <span class="game-id"><%= @id %></span></h2>

      <div class="players">
        <h4>Players</h4>
        <ul id="players-list" phx-update="stream">
          <li :for={{dom_id, user} <- @streams.users} id={dom_id}>
            <span><%= user.name %></span>
          </li>
        </ul>
      </div>

      <div class="lobby-link-info">
        <p>Send the following link to invite players.</p>
        <p>Click the link to copy it to your clipboard.</p>
        <div class="lobby-link"><%= @join_url %></div>
        <p>Or, they can enter game code <span class="game-id"><%= @id %></span> on the home page.</p>
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

      <.chat messages={@streams.chat_messages} submit="submit_chat" />

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
      send(self(), {:load_chat_messages, id})
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
     |> stream(:users, [])
     |> stream(:chat_messages, [])}
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
  def handle_info({:load_chat_messages, id}, socket) do
    messages =
      Golf.Chat.get_messages(id)
      |> Enum.map(&Map.put(&1, :turn, 0))

    # |> Enum.map(&Golf.Chat.put_player_turn(&1, socket.assigns.game.players))

    Golf.subscribe!("chat:#{id}")
    {:noreply, stream(socket, :chat_messages, messages, at: 0)}
  end

  @impl true
  def handle_info({:new_chat_message, message}, socket) do
    # message = Golf.Chat.put_player_turn(message, socket.assigns.game.players)
    message = Map.put(message, :turn, 0)
    {:noreply, stream_insert(socket, :chat_messages, message, at: 0)}
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

  @impl true
  def handle_event("submit_chat", %{"text" => text}, socket) do
    id = socket.assigns.id

    message =
      Golf.Chat.ChatMessage.new(id, socket.assigns.user, text)
      |> Golf.Chat.insert_message!()
      |> Map.update!(:inserted_at, &Golf.Chat.format_chat_time/1)

    Golf.broadcast!("chat:#{id}", {:new_chat_message, message})
    {:noreply, push_event(socket, "clear-chat-input", %{})}
  end

  defp topic(id), do: "lobby:#{id}"
end
