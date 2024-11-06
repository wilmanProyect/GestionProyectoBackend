const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jsonwebtoken  = require('jsonwebtoken');
const cors = require('cors');
const Usuario = require('./Model/Usuario');
const Proyecto = require('./Model/Proyecto');
const Tarea = require('./Model/Tarea');
const authMiddleware = require('./Middleware/authMiddleware');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY;

mongoose.connect('mongodb://localhost:27017/Tareas')
    .then(()=>console.log('Conectado a MongoDB'))
    .catch((error)=> console.log('Error al conectarse a MongoDB',error))



////////----------------------METODO POST---------------------- \\\\\\\\\\\\\
app.post('/register',async(req,res)=>{
    try{
        const {nombre,email,password}=req.body;
        if(!password){
            return res.status(400).send('Password Obligatorio')
        }
        const hashedPassword = await bcrypt.hash(password,10)
        const nuevoUsuario = new Usuario({nombre,email,password:hashedPassword})
        await nuevoUsuario.save();
        res.status(201).send('Usuario Registrado');
    }
    catch(error){
        res.status('400').send('Error en el Registro: ' + error.message)
    }
})

app.post('/login',async(req,res)=>{
    const {email,password}=req.body;
    try{
        const usuario = await Usuario.findOne({email});
        if(!usuario) return res.status(400).send('Credenciales incorrectas')
            const passwordCorrecto = await bcrypt.compare(password,usuario.password)
        if(!passwordCorrecto) return res.status(400).send('Credenciales incorrectas')

            const token = jsonwebtoken.sign({ id: usuario._id, email: usuario.email }, SECRET_KEY, { expiresIn: '1h' });
            res.status(200).json({token});
            
    }
    catch(error){
        res.status(500).send('Error al iniciar Sesion '+ error.message)
    }
})
app.post('/tarea', authMiddleware, async (req, res) => {
    try {
        const { proyecto, titulo, descripcion, estado, prioridad } = req.body;

        const nuevaTarea = new Tarea({
            proyecto,
            titulo,
            descripcion,
            estado,
            prioridad
        });

        await nuevaTarea.save();
        res.status(201).json(nuevaTarea);
    } catch (error) {
        res.status(400).send('Error al crear la tarea: ' + error.message);
    }
});

app.post('/proyecto', authMiddleware, async (req, res) => {
    try {
        const {nombre, descripcion, fechaInicio, fechaFin } = req.body;

        const nuevoProyecto = new Proyecto({
            usuario: req.user.id,
            nombre,
            descripcion,
            fechaInicio,
            fechaFin
        });
        await nuevoProyecto.save();
        res.status(201).json(nuevoProyecto);
    } catch (error) {
        res.status(400).send('Error al crear el proyecto: ' + error.message);
    }
});


////////-----------------METODO GET---------------------- \\\\\\\\\\\\\


app.get('/usuario',authMiddleware,async(req,res)=>{
    try {
        const usuario = await Usuario.findById(req.user.id);
        if (!usuario) {
            return res.status(404).send('Usuario no encontrado');
        }

        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).send('Error al obtener el usuario: ' + error.message);
    }
})

app.get('/proyectos', authMiddleware, async (req, res) => {
    try {
        const proyectos = await Proyecto.find({ usuario: req.user.id }).populate('usuario', 'nombre email');
        res.status(200).json(proyectos);
    } catch (error) {
        res.status(500).send('Error al obtener los proyectos: ' + error.message);
    }
});

app.get('/tareas', authMiddleware, async (req, res) => {
    try {
        const tareas = await Tarea.find().populate({
            path: 'proyecto',
            match: { usuario: req.user.id },  
            select: 'nombre'
        }).exec();

        const tareasFiltradas = tareas.filter(tarea => tarea.proyecto);

        res.status(200).json(tareasFiltradas);
    } catch (error) {
        res.status(500).send('Error al obtener las tareas: ' + error.message);
    }
});
////////-----------------METODO PUT---------------------- \\\\\\\\\\\\\

app.put('/proyecto/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, fechaInicio, fechaFin } = req.body;

        const proyectoActualizado = await Proyecto.findOneAndUpdate(
            { _id: id, usuario: req.user.id },  // Asegurar que el usuario autenticado sea el dueño
            { nombre, descripcion, fechaInicio, fechaFin },
            { new: true }  // Devolver el proyecto actualizado
        );

        if (!proyectoActualizado) {
            return res.status(404).send('Proyecto no encontrado o no autorizado');
        }

        res.status(200).json(proyectoActualizado);
    } catch (error) {
        res.status(400).send('Error al actualizar el proyecto: ' + error.message);
    }
});

app.put('/tarea/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, estado, prioridad } = req.body;

        const tareaActualizada = await Tarea.findOneAndUpdate(
            { _id: id },
            { titulo, descripcion, estado, prioridad },
            { new: true }
        ).populate({
            path: 'proyecto',
            match: { usuario: req.user.id }  // Asegurar que el proyecto pertenezca al usuario autenticado
        });

        if (!tareaActualizada || !tareaActualizada.proyecto) {
            return res.status(404).send('Tarea no encontrada o no autorizada');
        }

        res.status(200).json(tareaActualizada);
    } catch (error) {
        res.status(400).send('Error al actualizar la tarea: ' + error.message);
    }
});

////////-----------------METODO DELETE---------------------- \\\\\\\\\\\\\


app.delete('/proyecto/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const proyectoEliminado = await Proyecto.findOneAndDelete({ _id: id, usuario: req.user.id });
        if (!proyectoEliminado) {
            return res.status(404).send('Proyecto no encontrado o no autorizado');
        }
        res.status(200).json({ message: 'Proyecto y tareas asociadas eliminados correctamente' });
    } catch (error) {
        res.status(400).send('Error al eliminar el proyecto: ' + error.message);
    }
});

app.delete('/tarea/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const tareaEliminada = await Tarea.findOneAndDelete({ _id: id }).populate({
            path: 'proyecto',
            match: { usuario: req.user.id }  // Asegurar que el proyecto pertenezca al usuario autenticado
        });

        if (!tareaEliminada || !tareaEliminada.proyecto) {
            return res.status(404).send('Tarea no encontrada o no autorizada');
        }

        res.status(200).json({ message: 'Tarea eliminada correctamente' });
    } catch (error) {
        res.status(400).send('Error al eliminar la tarea: ' + error.message);
    }
});

const port = 3000
app.listen(port,()=>{
    console.log(`Servidor Corriendo en el puerto http://localhost:${port}`);
})
