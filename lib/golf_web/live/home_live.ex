defmodule GolfWeb.HomeLive do
  use GolfWeb, :live_view

  @impl true
  def render(assigns) do
    ~H"""
    <div id="home-page">
      <h2>Golf</h2>

      <p>User: <%= "#{@user.name}(#{@user.id})" %></p>

      <.form for={@name_form} phx-submit="update_username">
        <.input type="text" field={@name_form[:name]} />
        <button>Update Name</button>
      </.form>

      <form phx-submit="join_lobby">
        <.input name="id" value="" placeholder="Game ID" required />
        <button>Join Game</button>
      </form>

      <button phx-click="create_lobby">
        Create Game
      </button>
    </div>
    """
  end

  @impl true
  def mount(_params, session, socket) do
    user = Golf.Users.get_user_by_session_id(session["session_id"])
    name_form = Golf.Users.change_user(user) |> to_form()
    {:ok, assign(socket, page_title: "Home", user: user, name_form: name_form)}
  end

  @impl true
  def handle_event("create_lobby", _params, socket) do
    id = Golf.gen_id()
    _lobby = Golf.Lobbies.create_lobby(id, socket.assigns.user)
    {:noreply, push_navigate(socket, to: ~p"/lobby/#{id}")}
  end

  @impl true
  def handle_event("update_username", %{"user" => user_params}, socket) do
    case Golf.Users.update_user(socket.assigns.user, user_params) do
      {:ok, user} ->
        form = Golf.Users.change_user(user) |> to_form()
        {:noreply, assign(socket, user: user, name_form: form)}

      {:error, changeset} ->
        {:noreply, assign(socket, name_form: to_form(changeset))}
    end
  end

  @impl true
  def handle_event("join_lobby", %{"id" => id}, socket) do
    id = id |> String.trim() |> String.downcase()

    case Golf.Lobbies.get_lobby(id) do
      nil ->
        {:noreply, put_flash(socket, :error, "Game #{id} not found.")}

      lobby ->
        unless Golf.GamesDb.game_exists?(id) do
          user = socket.assigns.user
          {:ok, lobby} = Golf.Lobbies.add_lobby_user(lobby, user)
          Golf.broadcast!("lobby:#{id}", {:user_joined, lobby, user})
          {:noreply, push_navigate(socket, to: ~p"/lobby/#{id}")}
        else
          {:noreply, put_flash(socket, :error, "Game #{id} already started.")}
        end
    end
  end
end
