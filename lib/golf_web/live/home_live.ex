defmodule GolfWeb.HomeLive do
  use GolfWeb, :live_view

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h2>Golf</h2>

      <p>User: <%= "#{@user.name}(#{@user.id})" %></p>

      <.form for={@form} phx-submit="update_username">
        <.input type="text" field={@form[:name]} />
        <button>Update Username</button>
      </.form>

      <button phx-click="create_lobby">
        Create Game
      </button>
    </div>
    """
  end

  @impl true
  def mount(_params, session, socket) do
    user = Golf.Users.get_user_by_session_id(session["session_id"])
    form = Golf.Users.change_user(user) |> to_form()
    {:ok, assign(socket, page_title: "Home", user: user, form: form)}
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
        {:noreply, assign(socket, user: user, form: form)}
      {:error, changeset} ->
        {:noreply, assign(socket, form: to_form(changeset))}
    end
  end
end
